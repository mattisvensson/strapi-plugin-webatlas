import type { Core, UID } from '@strapi/strapi'
import { errors } from '@strapi/utils'
import { transformToUrl, waRoute, waNavItem, PLUGIN_ID } from '../../../utils'
import { ContentType, PluginConfig, Route } from '../../../types'
import {
	duplicateCheck,
	buildCanonicalPath,
	cascadePathUpdates,
	validateRouteDependencies,
	assertPathAllowed,
	getRouteBlacklist,
	assertDescendantPathsAllowed,
} from '../utils'

// types/strapi.ts (or a new types/webatlas.ts)
export type WebatlasDocumentData = {
	webatlas?: {
		slug?: string
		path?: string
		parentDocumentId?: string | null
		isOverride?: boolean
		[key: string]: any
	}
	[key: string]: any
}

export type DocumentResult = {
	id: number
	documentId: string
	[key: string]: any
}

// The route an entry gets without (permitted) route data: generated from the source field and
// placed below the default parent route of the content type. Read from the store, since the
// default parent route can change at runtime.
async function getDefaultRouteData(
	strapi: Core.Strapi,
	uid: string,
	data: WebatlasDocumentData,
): Promise<WebatlasDocumentData['webatlas']> {
	const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
	const currentConfig = (await pluginStore.get({ key: 'config' })) as PluginConfig | null
	const ctSettings = currentConfig?.selectedContentTypes.find((ct) => ct.uid === uid)

	const sourceValue = ctSettings?.routeSourceField ? data[ctSettings.routeSourceField] : undefined
	if (typeof sourceValue !== 'string' || !sourceValue.trim()) return undefined

	const defaultParent = ctSettings.defaultParentRoute
		? ((await strapi.documents(waRoute).findFirst({
				filters: { relatedDocumentId: ctSettings.defaultParentRoute },
			})) as Route | null)
		: null

	return {
		slug: transformToUrl(sourceValue),
		parentDocumentId: defaultParent?.documentId ?? null,
		isOverride: false,
	}
}

export function documentMiddleware(
	strapi: Core.Strapi,
	enabledContentTypes: ContentType[],
	config: PluginConfig,
) {
	const actions = ['create', 'update', 'delete']

	strapi.documents.use(async (context, next) => {
		if (
			!enabledContentTypes.map((type: ContentType) => type.uid).includes(context.uid) ||
			!actions.includes(context.action)
		) {
			return next()
		}

		const ctSettings = config.selectedContentTypes.find((ct) => ct.uid === context.uid)

		// Routes may only be created or moved from the admin panel or by server-side code without a
		// request (e.g. scripts or cron jobs). Route data sent through any other request, like the
		// Content API, is dropped so it can neither claim paths nor move routes of other entries.
		const requestContext = strapi.requestContext.get()
		const isRouteDataAllowed =
			!requestContext || requestContext.state?.route?.info?.type === 'admin'
		// Admin users additionally need the permissions of the aside panel, requests without a user
		// (scripts, cron jobs) are trusted
		const userAbility = requestContext?.state?.userAbility
		const canUseAside = !userAbility || userAbility.can(`plugin::${PLUGIN_ID}.cm.aside`)
		const canEditPath = !userAbility || userAbility.can(`plugin::${PLUGIN_ID}.cm.edit-path`)
		if (
			(context.action === 'create' || context.action === 'update') &&
			(!isRouteDataAllowed || !canUseAside)
		) {
			delete (context.params.data as WebatlasDocumentData | undefined)?.webatlas
		}

		if (context.action === 'create') {
			const data = context.params.data as WebatlasDocumentData
			// Every entry gets a route. Without route data or the permission to edit the path, it is
			// generated automatically.
			const webatlas =
				data.webatlas && canEditPath
					? data.webatlas
					: await getDefaultRouteData(strapi, context.uid, data)
			const { slug, parentDocumentId, isOverride } = webatlas || {}
			const transformedSlug = slug ? transformToUrl(slug, !isOverride) : null

			// The route source field is not required, so an entry can be created without a slug.
			// No route is created in that case, it is created on a later update once a slug exists.
			if (!transformedSlug) return next()

			let parent: Route | null = null
			let isValid = false
			if (parentDocumentId) {
				isValid = await validateRouteDependencies({
					newParentId: parentDocumentId,
				})
				if (isValid) {
					parent = (await strapi.documents(waRoute).findOne({
						documentId: parentDocumentId,
					})) as Route
				}
			}

			let rawPath = transformedSlug
			if (!isOverride) rawPath = parent ? `${parent.path}/${transformedSlug}` : transformedSlug
			const validatedPath = await duplicateCheck(rawPath)
			if (!validatedPath)
				throw new errors.ApplicationError(
					`Failed to generate a unique path for slug: ${transformedSlug}`,
				)

			const title = context.params.data[ctSettings?.routeSourceField]?.trim() || transformedSlug
			const canonicalPath = await buildCanonicalPath(
				transformToUrl(title),
				isValid ? parent.documentId : null,
			)

			// Check the raw paths, since the deduplication suffix of duplicateCheck would otherwise
			// turn a blocked path into an allowed one
			const routeBlacklist = await getRouteBlacklist()
			assertPathAllowed(rawPath, routeBlacklist)
			assertPathAllowed(canonicalPath, routeBlacklist)

			const result = (await next()) as DocumentResult

			// Safety guard in case middleware fires more than once for the same document
			const existing = await strapi.db?.query(waRoute).findOne({
				where: { relatedDocumentId: result.documentId },
			})
			if (existing) return result

			const singularName = context.contentType.info.singularName

			await strapi.documents(waRoute).create({
				data: {
					relatedContentType: context.uid,
					relatedId: result.id,
					relatedDocumentId: result.documentId,
					slug: transformedSlug,
					path: validatedPath,
					uidPath: `${singularName}/${result.id}`,
					isOverride: isOverride || false,
					title,
					parent: isValid ? parent?.documentId : null,
					canonicalPath,
				},
			})

			return result
		}

		if (context.action === 'update') {
			const data = context.params.data as WebatlasDocumentData
			const { documentId } = context.params

			const relatedRoute = (await strapi.documents(waRoute).findFirst({
				filters: {
					relatedDocumentId: documentId,
				},
				populate: ['parent'],
			})) as Route | null

			let webatlas = data.webatlas
			if (!relatedRoute && (!webatlas || !canEditPath)) {
				// Entries without a route get one as soon as their source field has a value
				webatlas = await getDefaultRouteData(strapi, context.uid, data)
			} else if (relatedRoute && webatlas && !canEditPath) {
				// Without the permission to edit the path, only the automatic path follows the source
				// field, the parent route and an overridden path are kept
				const sourceValue = ctSettings?.routeSourceField
					? data[ctSettings.routeSourceField]
					: undefined
				webatlas =
					!relatedRoute.isOverride && typeof sourceValue === 'string' && sourceValue.trim()
						? {
								slug: transformToUrl(sourceValue),
								parentDocumentId: relatedRoute.parent?.documentId ?? null,
								isOverride: false,
							}
						: undefined
			}
			const { slug, parentDocumentId, isOverride } = webatlas || {}

			if (!slug) {
				const result = await next()
				return result
			}

			let parent: Route | null = null
			let isValid = false
			if (parentDocumentId) {
				isValid = await validateRouteDependencies({
					routeId: relatedRoute ? relatedRoute.documentId : null,
					newParentId: parentDocumentId,
				})
				if (isValid) {
					parent = (await strapi.documents(waRoute).findOne({
						documentId: parentDocumentId,
					})) as Route
				}
			}
			const transformedSlug = transformToUrl(slug, !isOverride)

			let rawPath = transformedSlug
			if (!isOverride) rawPath = parent ? `${parent.path}/${transformedSlug}` : transformedSlug
			const validatedPath = await duplicateCheck(rawPath, relatedRoute?.documentId ?? null)

			// Partial updates (path/parent change, publish) omit the source field, so keep the
			// stored route title instead of falling back to the URL-shaped slug
			const sourceValue = ctSettings?.routeSourceField
				? context.params.data[ctSettings.routeSourceField]?.trim()
				: undefined
			const title = sourceValue || relatedRoute?.title || slug
			const canonicalPath = isOverride
				? relatedRoute.path
				: await buildCanonicalPath(transformToUrl(title), parent?.documentId)

			// Check the raw paths, since the deduplication suffix of duplicateCheck would otherwise
			// turn a blocked path into an allowed one
			const routeBlacklist = await getRouteBlacklist()
			assertPathAllowed(rawPath, routeBlacklist)
			assertPathAllowed(canonicalPath, routeBlacklist)

			// Children inherit the new paths, so reject the move before anything is written
			if (relatedRoute)
				await assertDescendantPathsAllowed({
					validatedParentPath: validatedPath,
					parentRouteDocumentId: relatedRoute.documentId,
					canonicalPath,
					isOverride: isOverride || false,
					routeBlacklist,
				})

			const result = (await next()) as DocumentResult

			const routeData: any = {
				title,
				path: validatedPath,
				slug: slug,
				isOverride: isOverride || false,
				parent: parent?.documentId || null,
				canonicalPath: canonicalPath,
			}

			let routeDocumentId: string | undefined = relatedRoute?.documentId

			if (!relatedRoute) {
				const createdRoute = await strapi.documents(waRoute).create({
					data: {
						relatedContentType: context.uid,
						relatedId: result.id,
						relatedDocumentId: result.documentId,
						uidPath: `${context.contentType.info.singularName}/${result.id}`,
						...routeData,
					},
				})

				routeDocumentId = (createdRoute as any)?.documentId as string | undefined
			} else {
				// Use strapi.db.query().updateMany() instead of strapi.documents().update() so that
				// both draft and published route rows are updated atomically. strapi.documents().update()
				// is draft-only and its changes may not be visible to subsequent strapi.db queries
				// (e.g. inside cascadePathUpdates), causing children to read stale parent data.
				await strapi.documents(waRoute).update({
					documentId: relatedRoute.documentId,
					data: routeData,
				})
			}

			if (routeDocumentId) {
				await cascadePathUpdates({
					validatedParentPath: validatedPath,
					parentRouteDocumentId: routeDocumentId,
					canonicalPath,
					isOverride,
				})
			}
		}

		if (context.action === 'delete') {
			const result = await next()

			const relatedDocumentId = context.params.documentId

			const deletedRoute = await strapi.db.query(waRoute).delete({
				where: { relatedDocumentId: relatedDocumentId },
				populate: ['navitem'],
			})

			// Check if related documentId is present in plugin config in defaultParentRoute of any content type, and if so, remove it
			const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
			const currentConfig = (await pluginStore.get({ key: 'config' })) as PluginConfig
			const selectedContentTypes = currentConfig.selectedContentTypes.map((ct) =>
				ct.defaultParentRoute === relatedDocumentId ? { ...ct, defaultParentRoute: null } : ct,
			)
			if (selectedContentTypes.some((ct, i) => ct !== currentConfig.selectedContentTypes[i])) {
				await pluginStore.set({
					key: 'config',
					value: { ...currentConfig, selectedContentTypes },
				})
			}

			if (!deletedRoute?.documentId) return result

			const navItemDocumentIds = Array.from(
				deletedRoute.navitem?.map((item) => item.documentId),
			) as string[]
			for (const navItemDocumentId of navItemDocumentIds) {
				await strapi.documents(waNavItem).delete({ documentId: navItemDocumentId })
			}

			return result
		}

		const result = await next()
		return result
	})
}
