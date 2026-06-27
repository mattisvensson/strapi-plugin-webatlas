import { waRoute } from '../../../utils'

/**
 * Helper function to check if a value is an external URL
 * DocumentIds only contain lowercase letters and numbers
 * Everything else is considered an external URL (absolute URLs, relative paths, etc.)
 */
function isExternalUrl(value: string): boolean {
	return !/^[a-z0-9]+$/.test(value)
}

/**
 * Collect all route-picker field documentIds from data (including nested structures)
 */
function collectRoutePickerIds(obj: any, uid?: string): string[] {
	if (!obj || typeof obj !== 'object') return []

	const ids: string[] = []

	if (!uid) return ids

	// Check both contentTypes and components
	const ct = strapi.contentTypes[uid] || strapi.components?.[uid]
	if (!ct?.attributes) return ids

	for (const [key, attr] of Object.entries(ct.attributes)) {
		const attribute = attr as any

		// Collect from route-picker fields
		if (attribute.customField === 'plugin::webatlas.route-picker' && obj[key]) {
			const value = obj[key]
			if (typeof value === 'string' && !isExternalUrl(value)) {
				ids.push(value)
			}
		}

		// Collect from relations
		if (attribute.type === 'relation' && obj[key]) {
			const targetUid = attribute.target
			if (Array.isArray(obj[key])) {
				ids.push(...obj[key].flatMap((item: any) => collectRoutePickerIds(item, targetUid)))
			} else {
				ids.push(...collectRoutePickerIds(obj[key], targetUid))
			}
		}

		// Collect from components
		if (attribute.type === 'component' && obj[key]) {
			const componentUid = attribute.component
			if (Array.isArray(obj[key])) {
				ids.push(...obj[key].flatMap((item: any) => collectRoutePickerIds(item, componentUid)))
			} else {
				ids.push(...collectRoutePickerIds(obj[key], componentUid))
			}
		}

		// Collect from dynamic zones
		if (attribute.type === 'dynamiczone' && Array.isArray(obj[key])) {
			ids.push(
				...obj[key].flatMap((item: any) => {
					if (!item || !item.__component) return []
					return collectRoutePickerIds(item, item.__component)
				}),
			)
		}
	}

	return ids
}

/**
 * Recursively enrich route-picker fields in the data using pre-fetched route map
 */
function enrichEntity(entity: any, uid: string, routeMap: Map<string, any>): any {
	if (!entity || typeof entity !== 'object') return entity

	// Check both contentTypes and components
	const ct = strapi.contentTypes[uid] || strapi.components?.[uid]
	if (!ct?.attributes) return entity

	for (const [key, attr] of Object.entries(ct.attributes)) {
		const attribute = attr as any

		// Replace route-picker field values
		if (attribute.customField === 'plugin::webatlas.route-picker' && entity[key]) {
			const value = entity[key]
			if (typeof value === 'string' && !isExternalUrl(value)) {
				const route = routeMap.get(value)
				if (route) {
					entity[key] = route.canonicalPath || route.path || value
				}
			}
		}

		// Recursively process relations
		if (attribute.type === 'relation' && entity[key]) {
			const targetUid = attribute.target
			if (Array.isArray(entity[key])) {
				entity[key] = entity[key].map((item: any) =>
					item ? enrichEntity(item, targetUid, routeMap) : item,
				)
			} else {
				entity[key] = enrichEntity(entity[key], targetUid, routeMap)
			}
		}

		// Recursively process components
		if (attribute.type === 'component' && entity[key]) {
			const componentUid = attribute.component
			if (Array.isArray(entity[key])) {
				entity[key] = entity[key].map((item: any) =>
					item ? enrichEntity(item, componentUid, routeMap) : item,
				)
			} else {
				entity[key] = enrichEntity(entity[key], componentUid, routeMap)
			}
		}

		// Recursively process dynamic zones
		if (attribute.type === 'dynamiczone' && Array.isArray(entity[key])) {
			entity[key] = entity[key].map((item: any) => {
				if (!item || !item.__component) return item
				return enrichEntity(item, item.__component, routeMap)
			})
		}
	}

	return entity
}

/**
 * Recursively enrich route-picker fields in the data
 * Uses a two-pass approach: first collect all IDs, then fetch routes once, then enrich
 */
export async function enrichRoutePickerFields(data: any, contentTypeUid: string): Promise<any> {
	if (!data || typeof data !== 'object') return data

	// First pass: Collect all route-picker documentIds from all nested levels
	const documentIds = collectRoutePickerIds(data, contentTypeUid)

	if (documentIds.length === 0) return data

	// Remove duplicates
	const uniqueDocumentIds = [...new Set(documentIds)]

	// Fetch all routes in one query
	const routes = await strapi.db?.query(waRoute).findMany({
		where: {
			documentId: { $in: uniqueDocumentIds },
		},
		select: ['documentId', 'path', 'canonicalPath'],
	})

	// Create a map for quick lookup
	const routeMap = new Map(routes?.map((route: any) => [route.documentId, route]) || [])

	// Second pass: Recursively enrich all entities using the route map
	const enriched = enrichEntity(data, contentTypeUid, routeMap)
	return enriched
}
