import { waRoute } from '../../../utils'
export default async function buildCanonicalPath(slug, parentDocumentId) {
	try {
		const parentRoute = await strapi.documents(waRoute).findOne({
			documentId: parentDocumentId,
		})
		const parentCanonicalPath =
			(parentRoute === null || parentRoute === void 0 ? void 0 : parentRoute.canonicalPath) || ''
		const canonicalPath = `${parentCanonicalPath ? parentCanonicalPath + '/' : ''}${slug}`
		return canonicalPath
	} catch (err) {
		strapi.log.error('Error building canonical path:', err)
		return slug // Fallback to just the slug
	}
}
