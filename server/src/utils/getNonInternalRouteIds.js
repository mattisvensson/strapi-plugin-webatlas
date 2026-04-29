import { waRoute } from '../../../utils'
export default async function getNonInternalRouteIds() {
	const routes = await strapi.documents(waRoute).findMany({
		filters: {
			type: {
				$ne: 'internal',
			},
		},
	})
	const routeIds = routes.map((route) => route.documentId)
	return routeIds
}
