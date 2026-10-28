import type { Route, StructuredNavigationVariant } from '../../../types'
import type { UID } from '@strapi/strapi'
import {
	buildStructuredNavigation,
	extractRouteAndItems,
	getFullPopulateObject,
	cleanRootKeys,
	removeWaFields,
	enrichWebatlasData,
	enrichRoutePickerFields,
	addWebatlasBreadcrumb,
	removeUnpublishedNavItems,
} from '../utils'
import { waRoute, waNavigation } from '../../../utils'

export default ({ strapi }) => ({
	async getEntityByPath(
		slug: string,
		populate: string,
		populateDeepDepth: number,
		fields: any,
		status: 'draft' | 'published' = 'published',
		breadcrumb: boolean = true,
		auth?: any,
	) {
		const route: Route = await strapi.documents(waRoute).findFirst({
			filters: {
				$or: [{ path: slug }, { canonicalPath: slug }, { uidPath: slug }],
			},
		})

		if (!route) return null

		let populateObject: string | Record<string, boolean | Record<string, any>> = populate

		if (populate === 'deep') {
			const modelObject = getFullPopulateObject(
				route.relatedContentType as UID.Schema,
				populateDeepDepth,
				[],
			)
			// Without populatable attributes (or at depth 1) there is nothing to populate
			populateObject =
				typeof modelObject === 'object' && 'populate' in modelObject
					? modelObject.populate
					: undefined
		}

		const contentTypeObject: any = Object.entries(strapi.contentTypes).find(
			([key, value]) => key === route.relatedContentType,
		)

		if (!contentTypeObject) {
			return null
		}

		const [contentTypeKey, contentType] = contentTypeObject

		// The webatlas permission only grants access to the endpoint, the requester also needs read
		// access to the content type of the requested entry, like on its regular API endpoint.
		// A missing permission results in a 404, so it is not revealed whether the path exists.
		const action = contentType.kind === 'singleType' ? 'find' : 'findOne'
		try {
			await strapi.auth.verify(auth, { scope: [`${contentTypeKey}.${action}`] })
		} catch {
			return null
		}

		// Validate and sanitize like the Strapi core controllers do, so private fields, passwords and
		// relations the requester has no find permission for can neither be requested nor returned.
		// sanitize.query does not pass auth to the populate sanitizer, so populate is sanitized separately.
		// The generated deep populate object may contain private relations, which validation would reject,
		// so only user-supplied populate values are validated. Sanitizing strips them from both.
		await strapi.contentAPI.validate.query(
			{ populate: populate === 'deep' ? undefined : populate, fields },
			contentType,
			{ auth },
		)
		const sanitizedQuery = await strapi.contentAPI.sanitize.query({ fields }, contentType, { auth })
		const sanitizedPopulate = populateObject
			? await strapi.contentAPI.sanitize.populate(populateObject, contentType, { auth })
			: undefined

		const entity = await strapi.documents(route.relatedContentType).findOne({
			documentId: route.relatedDocumentId,
			populate: sanitizedPopulate,
			fields: sanitizedQuery.fields,
			status: status,
		})

		if (!entity) return null

		const sanitizedEntity = await strapi.contentAPI.sanitize.output(entity, contentType, { auth })

		let cleanEntity = cleanRootKeys(sanitizedEntity)
		cleanEntity = removeWaFields(cleanEntity)

		cleanEntity = await enrichWebatlasData(cleanEntity, route.relatedContentType)
		if (breadcrumb) {
			cleanEntity = await addWebatlasBreadcrumb(cleanEntity, route)
		}
		cleanEntity = await enrichRoutePickerFields(cleanEntity, contentTypeKey)

		return {
			contentType: contentType.info.singularName,
			...cleanEntity,
		}
	},

	async getNavigation(
		id: string,
		name: string,
		slug: string,
		documentId: string,
		variant: StructuredNavigationVariant = 'nested',
	) {
		let navigation = null

		const populateObject = ['items', 'items.parent', 'items.route']

		const lookupMethods = [
			{
				condition: documentId,
				lookup: () =>
					strapi.documents(waNavigation).findOne({
						documentId: documentId,
						populate: populateObject,
					}),
				name: 'documentId',
			},
			{
				condition: slug,
				lookup: () =>
					strapi.db?.query(waNavigation).findOne({
						where: { slug: slug },
						populate: populateObject,
					}),
				name: 'slug',
			},
			{
				condition: name,
				lookup: () =>
					strapi.db?.query(waNavigation).findOne({
						where: { name: name },
						populate: populateObject,
					}),
				name: 'name',
			},
			{
				condition: id,
				lookup: () =>
					strapi.db?.query(waNavigation).findOne({
						where: { id: id },
						populate: populateObject,
					}),
				name: 'id',
			},
		]

		for (const method of lookupMethods) {
			if (method.condition && !navigation) {
				try {
					navigation = await method.lookup()
				} catch (error) {
					strapi.log.error(`Navigation lookup by ${method.name} failed:`, error)
				}
			}
		}

		if (!navigation) return null

		if (navigation.items) navigation.items = await removeUnpublishedNavItems(navigation.items)

		const structured = buildStructuredNavigation(navigation, variant)

		if (!structured) return null

		const entityNavigation = extractRouteAndItems(structured.items)

		return { ...structured, items: entityNavigation }
	},
})
