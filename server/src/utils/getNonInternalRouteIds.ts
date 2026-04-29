import type { UID } from '@strapi/strapi'
import { waRoute } from '../../../utils'

export default async function getNonInternalRouteIds(): Promise<string[]> {
	const routes = await strapi.documents(waRoute as UID.ContentType).findMany({
		filters: {
			type: {
				$ne: 'internal',
			},
		},
	})

	const routeIds = routes.map((route) => route.documentId)

	return routeIds
}
