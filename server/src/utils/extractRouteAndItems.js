import { PLUGIN_ID } from '../../../utils'
export default function extractRouteAndItems(items) {
	return items.map((item) => {
		var _a
		const route = { ...item.route }
		if (!route) return null
		let depth = null
		if (item.depth !== undefined) {
			depth = item.depth
		}
		let children = null
		if (((_a = item.items) === null || _a === void 0 ? void 0 : _a.length) > 0) {
			const items = extractRouteAndItems(item.items)
			if (items.length > 0) children = items
		}
		delete route.relatedContentType
		delete route.relatedDocumentId
		delete route.relatedId
		delete route.createdAt
		delete route.updatedAt
		delete route.isOverride
		return {
			__component: route.type === 'wrapper' ? `${PLUGIN_ID}.wrapper` : `${PLUGIN_ID}.route`,
			type: route.type,
			...route,
			depth: depth !== null ? depth : undefined,
			items: children !== null ? children : undefined,
		}
	})
}
