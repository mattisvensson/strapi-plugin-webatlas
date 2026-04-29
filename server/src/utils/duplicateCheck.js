import { waRoute } from '../../../utils'
async function checkPathExists(path, excludeDocumentId) {
	const filters = {
		$or: [{ path: path }, { uidPath: path }, { canonicalPath: path }],
	}
	if (excludeDocumentId) {
		filters.documentId = { $ne: excludeDocumentId }
	}
	const entity = await strapi.documents(waRoute).findFirst({ filters })
	return !!entity
}
export default async function duplicateCheck(initialPath, targetRouteDocumentId) {
	try {
		let uniquePath = initialPath
		let counter = 1
		// Check if the path exists, excluding the target route itself
		let exists = await checkPathExists(uniquePath, targetRouteDocumentId)
		// While the path exists, append/increment a number and check again
		while (exists) {
			uniquePath = `${initialPath}-${counter}`
			exists = await checkPathExists(uniquePath, targetRouteDocumentId)
			counter++
		}
		// Return the unique path
		return uniquePath
	} catch (e) {
		strapi.log.error(e)
	}
}
