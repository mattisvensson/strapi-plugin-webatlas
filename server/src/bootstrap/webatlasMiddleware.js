import { waRoute, waNavItem } from '../../../utils'
export function webatlasMiddleware(strapi) {
	strapi.documents.use(async (context, next) => {
		var _a, _b
		if (context.uid !== waNavItem) return next()
		if (context.action === 'delete') {
			let externalRouteDocumentId = null
			try {
				const navItem = await ((_a = strapi.db) === null || _a === void 0
					? void 0
					: _a.query(waNavItem).findOne({
							where: { documentId: context.params.documentId },
							populate: ['route'],
						}))
				if (
					((_b = navItem === null || navItem === void 0 ? void 0 : navItem.route) === null ||
					_b === void 0
						? void 0
						: _b.type) === 'external'
				) {
					externalRouteDocumentId = navItem.route.documentId
				}
			} catch (err) {
				strapi.log.error(err)
			}
			const result = await next()
			if (externalRouteDocumentId) {
				try {
					await strapi.documents(waRoute).delete({ documentId: externalRouteDocumentId })
				} catch (err) {
					strapi.log.error(err)
				}
			}
			return result
		}
		return next()
	})
}
