import { getRouteDescendants, getNonInternalRouteIds } from '.'
import { waRoute } from '../../../utils'
export default async function validateRouteDependencies({ routeId, newParentId }) {
	if (!newParentId) return true
	const normalizedRouteId = routeId !== null && routeId !== void 0 ? routeId : undefined
	const parentRoute = await strapi.documents(waRoute).findOne({
		documentId: newParentId,
	})
	if (!parentRoute) {
		throw new Error(`Parent route not found: ${newParentId}`)
	}
	if ((parentRoute === null || parentRoute === void 0 ? void 0 : parentRoute.type) === 'external') {
		throw new Error('External routes cannot have children')
	}
	if (!normalizedRouteId) return true
	const descendants = await getRouteDescendants(normalizedRouteId)
	const nonInternalRouteIds = await getNonInternalRouteIds()
	if (
		normalizedRouteId === newParentId ||
		descendants.includes(newParentId) ||
		nonInternalRouteIds.includes(newParentId)
	) {
		throw new Error(
			`Circular dependency detected: Cannot set route ${newParentId} as parent of ${normalizedRouteId}`,
		)
	}
	return true
}
