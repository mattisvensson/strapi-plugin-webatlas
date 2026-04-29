import { waRoute } from '../../../utils'
export default async function getRouteAncestors(routeId) {
	const ancestors = []
	let currentId = routeId
	while (currentId) {
		const route = await strapi.documents(waRoute).findOne({
			documentId: currentId,
			populate: ['parent'],
		})
		if (!(route === null || route === void 0 ? void 0 : route.parent)) break
		ancestors.push(route.parent.documentId)
		currentId = route.parent.documentId
	}
	return ancestors
}
