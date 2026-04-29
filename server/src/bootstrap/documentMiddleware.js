import { transformToUrl, waRoute, waNavItem } from '../../../utils'
import {
	duplicateCheck,
	buildCanonicalPath,
	cascadePathUpdates,
	validateRouteDependencies,
} from '../utils'
export function documentMiddleware(strapi, enabledContentTypes, config) {
	const actions = ['create', 'update', 'delete']
	strapi.documents.use(async (context, next) => {
		var _a, _b, _c, _d, _e, _f
		if (
			!enabledContentTypes.map((type) => type.uid).includes(context.uid) ||
			!actions.includes(context.action)
		) {
			return next()
		}
		const ctSettings = config.selectedContentTypes.find((ct) => ct.uid === context.uid)
		if (context.action === 'create') {
			const data = context.params.data
			const { webatlas } = data
			const { slug, parentDocumentId, isOverride } = webatlas || {}
			const transformedSlug = slug ? transformToUrl(slug) : null
			if (transformedSlug) {
				data.webatlas.slug = transformedSlug
			}
			const result = await next()
			if (!transformedSlug) return result
			// Safety guard in case middleware fires more than once for the same document
			const existing = await ((_a = strapi.db) === null || _a === void 0
				? void 0
				: _a.query(waRoute).findOne({
						where: { relatedDocumentId: result.documentId },
					}))
			if (existing) return result
			let parent = null
			let isValid = false
			if (parentDocumentId) {
				isValid = await validateRouteDependencies({
					newParentId: parentDocumentId,
				})
				if (isValid) {
					parent = await strapi.documents(waRoute).findOne({
						documentId: parentDocumentId,
					})
				}
			}
			let rawPath = transformedSlug
			if (!isOverride) rawPath = parent ? `${parent.path}/${transformedSlug}` : transformedSlug
			const validatedPath = await duplicateCheck(rawPath)
			if (!validatedPath)
				throw new Error(`Failed to generate a unique path for slug: ${transformedSlug}`)
			const singularName = context.contentType.info.singularName
			const title =
				((_b =
					context.params.data[
						ctSettings === null || ctSettings === void 0 ? void 0 : ctSettings.default
					]) === null || _b === void 0
					? void 0
					: _b.trim()) || transformedSlug
			const canonicalPath = await buildCanonicalPath(
				transformToUrl(title),
				isValid ? parent.documentId : null,
			)
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
					parent: isValid
						? parent === null || parent === void 0
							? void 0
							: parent.documentId
						: null,
					canonicalPath,
				},
			})
			await ((_c = strapi.db) === null || _c === void 0
				? void 0
				: _c.query(context.uid).updateMany({
						where: { documentId: result.documentId },
						data: {
							webatlas: {
								...webatlas,
								slug: transformedSlug,
								path: validatedPath,
								parentDocumentId: isValid
									? parent === null || parent === void 0
										? void 0
										: parent.documentId
									: 'null',
								isOverride: isOverride || false,
							},
						},
					}))
			return result
		}
		if (context.action === 'update') {
			const data = context.params.data
			const { documentId } = context.params
			const { webatlas } = data
			const { slug, parentDocumentId, isOverride } = webatlas || {}
			if (!slug) return
			const relatedRoute = await strapi.documents(waRoute).findFirst({
				filters: {
					relatedDocumentId: documentId,
				},
			})
			let parent = null
			let isValid = false
			if (parentDocumentId) {
				isValid = await validateRouteDependencies({
					routeId: relatedRoute ? relatedRoute.documentId : null,
					newParentId: parentDocumentId,
				})
				if (isValid) {
					parent = await strapi.documents(waRoute).findOne({
						documentId: parentDocumentId,
					})
				}
			}
			const transformedSlug = transformToUrl(slug)
			let rawPath = transformedSlug
			if (!isOverride) rawPath = parent ? `${parent.path}/${transformedSlug}` : transformedSlug
			const validatedPath = await duplicateCheck(
				rawPath,
				(_d =
					relatedRoute === null || relatedRoute === void 0 ? void 0 : relatedRoute.documentId) !==
					null && _d !== void 0
					? _d
					: null,
			)
			data.webatlas.path = validatedPath
			data.webatlas.slug = transformedSlug
			if (relatedRoute) data.relatedRoute = relatedRoute
			if (!isValid && parentDocumentId) data.webatlas.parent = null
			const result = await next()
			const title =
				((_e =
					context.params.data[
						ctSettings === null || ctSettings === void 0 ? void 0 : ctSettings.default
					]) === null || _e === void 0
					? void 0
					: _e.trim()) || slug
			const canonicalPath = isOverride
				? relatedRoute.path
				: await buildCanonicalPath(
						transformToUrl(title),
						parent === null || parent === void 0 ? void 0 : parent.documentId,
					)
			const routeData = {
				title,
				path: validatedPath,
				slug: slug,
				isOverride: isOverride || false,
				parent: (parent === null || parent === void 0 ? void 0 : parent.documentId) || null,
				canonicalPath: canonicalPath,
			}
			let routeDocumentId =
				relatedRoute === null || relatedRoute === void 0 ? void 0 : relatedRoute.documentId
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
				routeDocumentId =
					createdRoute === null || createdRoute === void 0 ? void 0 : createdRoute.documentId
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
			try {
				const relatedDocumentId = context.params.documentId
				const deletedRoute = await strapi.db.query(waRoute).delete({
					where: { relatedDocumentId: relatedDocumentId },
					populate: ['navitem'],
				})
				if (!(deletedRoute === null || deletedRoute === void 0 ? void 0 : deletedRoute.documentId))
					return result
				const navItemDocumentIds = Array.from(
					(_f = deletedRoute.navitem) === null || _f === void 0
						? void 0
						: _f.map((item) => item.documentId),
				)
				for (const navItemDocumentId of navItemDocumentIds) {
					await strapi.documents(waNavItem).delete({ documentId: navItemDocumentId })
				}
			} catch (err) {
				strapi.log.error(err)
			}
			return result
		}
		const result = await next()
		return result
	})
}
