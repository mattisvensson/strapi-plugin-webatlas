import type { Core, UID } from '@strapi/strapi'
import { waRoute, waNavItem } from '../../../utils'

export function webatlasMiddleware(strapi: Core.Strapi) {
	strapi.documents.use(async (context, next) => {
		if (context.uid !== waNavItem) return next()

		if (context.action === 'delete') {
			// Read the route before the nav item is gone, so the external route it owns can be
			// deleted with it
			let externalRouteDocumentId: string | null = null

			const navItem = await strapi.db?.query(waNavItem).findOne({
				where: { documentId: context.params.documentId },
				populate: ['route'],
			})

			if (navItem?.route?.type === 'external') {
				externalRouteDocumentId = navItem.route.documentId
			}

			const result = await next()

			if (externalRouteDocumentId) {
				await strapi.documents(waRoute).delete({ documentId: externalRouteDocumentId })
			}

			return result
		}

		return next()
	})
}
