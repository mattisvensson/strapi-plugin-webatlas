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
 * Recursively enrich route-picker fields in the data
 */
export async function enrichRoutePickerFields(data: any, contentTypeUid: string): Promise<any> {
	if (!data || typeof data !== 'object') return data

	const ct = strapi.contentTypes[contentTypeUid]
	if (!ct?.attributes) return data

	// Collect all documentIds from route-picker fields
	const routePickerFields: { fieldName: string; documentId: string }[] = []
	for (const [fieldName, attribute] of Object.entries(ct.attributes)) {
		const attr = attribute as any

		// Check if this is a route-picker custom field
		if (attr.customField === 'plugin::webatlas.route-picker' && data[fieldName]) {
			const value = data[fieldName]

			// Only collect if it's not an external URL
			if (typeof value === 'string' && !isExternalUrl(value)) {
				routePickerFields.push({ fieldName, documentId: value })
			}
		}

		// Handle relations - recursively process
		if (attr.type === 'relation' && data[fieldName]) {
			const targetUid = attr.target
			if (Array.isArray(data[fieldName])) {
				data[fieldName] = await Promise.all(
					data[fieldName].map((item: any) => enrichRoutePickerFields(item, targetUid)),
				)
			} else {
				data[fieldName] = await enrichRoutePickerFields(data[fieldName], targetUid)
			}
		}

		// Handle components - recursively process
		if (attr.type === 'component' && data[fieldName]) {
			const componentUid = attr.component
			if (Array.isArray(data[fieldName])) {
				data[fieldName] = await Promise.all(
					data[fieldName].map((item: any) => enrichRoutePickerFields(item, componentUid)),
				)
			} else {
				data[fieldName] = await enrichRoutePickerFields(data[fieldName], componentUid)
			}
		}

		// Handle dynamic zones - recursively process
		if (attr.type === 'dynamiczone' && Array.isArray(data[fieldName])) {
			data[fieldName] = await Promise.all(
				data[fieldName].map((item: any) => {
					if (!item || !item.__component) return item
					return enrichRoutePickerFields(item, item.__component)
				}),
			)
		}
	}

	// If no route-picker fields found, return as is
	if (routePickerFields.length === 0) return data

	// Fetch all routes at once for efficiency
	const documentIds = routePickerFields.map((f) => f.documentId)
	const routes = await strapi.db?.query(waRoute).findMany({
		where: {
			documentId: { $in: documentIds },
		},
		select: ['documentId', 'path', 'canonicalPath'],
	})

	// Create a map for quick lookup
	const routeMap = new Map(routes?.map((route: any) => [route.documentId, route]) || [])

	// Replace documentIds with paths
	for (const { fieldName, documentId } of routePickerFields) {
		const route = routeMap.get(documentId)
		if (route) {
			// Use canonicalPath if available, otherwise path
			data[fieldName] = route.canonicalPath || route.path || documentId
		}
		// If route not found, leave the documentId as is (fallback)
	}

	return data
}
