import { waRoute } from '../../../utils'
export default async function getRouteDescendants(routeId) {
	const descendants = []
	const stack = [routeId]
	while (stack.length > 0) {
		const currentId = stack.pop()
		if (!currentId) continue
		const children = await strapi.documents(waRoute).findMany({
			filters: {
				parent: {
					documentId: currentId,
				},
			},
		})
		for (const child of children) {
			descendants.push(child.documentId)
			stack.push(child.documentId)
		}
	}
	return descendants
}
