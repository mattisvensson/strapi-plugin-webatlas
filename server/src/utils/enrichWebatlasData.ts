import { waRoute } from '../../../utils'

/**
 * Enriches response data with webatlas fields for all enabled content types
 * Works recursively to handle nested relations, components, and dynamic zones
 */
export async function enrichWebatlasData(data: any, contentTypeUid?: string): Promise<any> {
	if (!data || typeof data !== 'object') return data

	// Helper to collect all documentIds from the data (including nested)
	const collectDocumentIds = (obj: any, uid?: string): string[] => {
		if (!obj || typeof obj !== 'object') return []

		const ids: string[] = []
		if (obj.documentId) ids.push(obj.documentId)

		if (!uid) return ids

		const ct = strapi.contentTypes[uid]
		if (!ct?.attributes) return ids

		// Collect from nested relations and components
		for (const [key, attr] of Object.entries(ct.attributes)) {
			const attribute = attr as any

			// Handle relations
			if (attribute.type === 'relation' && obj[key]) {
				const targetUid = attribute.target
				if (Array.isArray(obj[key])) {
					ids.push(...obj[key].flatMap((item: any) => collectDocumentIds(item, targetUid)))
				} else {
					ids.push(...collectDocumentIds(obj[key], targetUid))
				}
			}

			// Handle components
			if (attribute.type === 'component' && obj[key]) {
				const componentUid = attribute.component
				if (Array.isArray(obj[key])) {
					ids.push(...obj[key].flatMap((item: any) => collectDocumentIds(item, componentUid)))
				} else {
					ids.push(...collectDocumentIds(obj[key], componentUid))
				}
			}

			// Handle dynamic zones
			if (attribute.type === 'dynamiczone' && Array.isArray(obj[key])) {
				ids.push(
					...obj[key].flatMap((item: any) => {
						if (!item || !item.__component) return []
						return collectDocumentIds(item, item.__component)
					}),
				)
			}
		}

		return ids
	}

	const documentIds = collectDocumentIds(data, contentTypeUid)
	// console.log(`documentIds: ${documentIds}`)
	if (documentIds.length === 0) return data

	// Remove duplicates
	const uniqueDocumentIds = [...new Set(documentIds)]

	// Fetch all routes in one query
	const routes = await strapi.db?.query(waRoute).findMany({
		where: {
			relatedDocumentId: { $in: uniqueDocumentIds },
		},
		select: ['relatedDocumentId', 'relatedContentType', 'path', 'canonicalPath', 'slug', 'uidPath'],
	})

	// Create a map for quick lookup
	const routeMap = new Map(routes?.map((route: any) => [route.relatedDocumentId, route]) || [])
	// console.log(routeMap)
	// Helper to enrich data recursively
	const enrichEntity = (entity: any, uid?: string): any => {
		if (!entity || typeof entity !== 'object') return entity

		// Check if webatlas is enabled for this content type
		const ct = uid ? strapi.contentTypes[uid] : null
		const isWebatlasEnabled = ct?.pluginOptions?.webatlas?.enabled === true

		// Add webatlas data if enabled and we have a route
		if (isWebatlasEnabled && entity.documentId && routeMap.has(entity.documentId)) {
			const route = routeMap.get(entity.documentId)
			entity.webatlas = {
				path: route.path || '',
				canonicalPath: route.canonicalPath || '',
				slug: route.slug || '',
				uidPath: route.uidPath || '',
			}
		}

		// Recursively process relations and components
		if (ct?.attributes) {
			for (const [key, attr] of Object.entries(ct.attributes)) {
				const attribute = attr as any

				// Handle relations
				if (attribute.type === 'relation' && entity[key]) {
					const targetUid = attribute.target
					if (Array.isArray(entity[key])) {
						entity[key] = entity[key].map((item: any) =>
							item ? enrichEntity(item, targetUid) : item,
						)
					} else {
						entity[key] = enrichEntity(entity[key], targetUid)
					}
				}

				// Handle components
				if (attribute.type === 'component' && entity[key]) {
					const componentUid = attribute.component
					if (Array.isArray(entity[key])) {
						entity[key] = entity[key].map((item: any) =>
							item ? enrichEntity(item, componentUid) : item,
						)
					} else {
						entity[key] = enrichEntity(entity[key], componentUid)
					}
				}

				// Handle dynamic zones
				if (attribute.type === 'dynamiczone' && Array.isArray(entity[key])) {
					entity[key] = entity[key].map((item: any) => {
						if (!item || !item.__component) return item
						return enrichEntity(item, item.__component)
					})
				}
			}
		}
		return entity
	}

	return enrichEntity(data, contentTypeUid)
}
