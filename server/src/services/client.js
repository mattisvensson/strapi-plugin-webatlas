import {
	buildStructuredNavigation,
	extractRouteAndItems,
	getFullPopulateObject,
	cleanRootKeys,
	removeWaFields,
} from '../utils'
import { waRoute, waNavigation } from '../../../utils'
export default ({ strapi }) => ({
	async getEntityByPath(slug, populate, populateDeepDepth, fields, status = 'published') {
		try {
			const route = await strapi.documents(waRoute).findFirst({
				filters: {
					$or: [{ path: slug }, { canonicalPath: slug }, { uidPath: slug }],
				},
			})
			if (!route) return null
			let populateObject = populate
			if (populate === 'deep') {
				const modelObject = getFullPopulateObject(
					route.relatedContentType,
					Number(populateDeepDepth),
					[],
				)
				if (typeof modelObject === 'object' && 'populate' in modelObject) {
					populateObject = modelObject.populate
				}
			}
			const contentTypeObject = Object.entries(strapi.contentTypes).find(
				([key, value]) => key === route.relatedContentType,
			)
			if (!contentTypeObject) {
				return null
			}
			const [contentTypeKey, contentType] = contentTypeObject
			const entity = await strapi.documents(route.relatedContentType).findOne({
				documentId: route.relatedDocumentId,
				populate: populateObject,
				fields: fields,
				status: status,
			})
			if (!entity) return null
			let cleanEntity = cleanRootKeys(entity)
			cleanEntity = removeWaFields(cleanEntity)
			const webatlasFields = {
				path: route.path,
				canonicalPath: route.canonicalPath,
				slug: route.slug,
				uidPath: route.uidPath,
			}
			return {
				contentType: contentType.info.singularName,
				webatlas: {
					...webatlasFields,
				},
				...cleanEntity,
			}
		} catch (e) {
			strapi.log.error(e)
			return e
		}
	},
	async getNavigation(id, name, slug, documentId, variant = 'nested') {
		try {
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
					lookup: () => {
						var _a
						return (_a = strapi.db) === null || _a === void 0
							? void 0
							: _a.query(waNavigation).findOne({
									where: { slug: slug },
									populate: populateObject,
								})
					},
					name: 'slug',
				},
				{
					condition: name,
					lookup: () => {
						var _a
						return (_a = strapi.db) === null || _a === void 0
							? void 0
							: _a.query(waNavigation).findOne({
									where: { name: name },
									populate: populateObject,
								})
					},
					name: 'name',
				},
				{
					condition: id,
					lookup: () => {
						var _a
						return (_a = strapi.db) === null || _a === void 0
							? void 0
							: _a.query(waNavigation).findOne({
									where: { id: id },
									populate: populateObject,
								})
					},
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
			const structured = buildStructuredNavigation(navigation, variant)
			if (!structured) return null
			const entityNavigation = extractRouteAndItems(structured.items)
			return { ...structured, items: entityNavigation }
		} catch (e) {
			strapi.log.error(e)
			return e
		}
	},
})
