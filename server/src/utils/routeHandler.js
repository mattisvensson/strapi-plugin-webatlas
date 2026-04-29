import { waRoute } from '../../../utils/'
async function createExternalRoute(data) {
	try {
		return await strapi.documents(waRoute).create({
			data: {
				title: data.title,
				slug: data.path,
				path: data.path,
				relatedContentType: '',
				relatedId: 0,
				relatedDocumentId: '',
				uidPath: '',
				type: data.type || 'external',
			},
		})
	} catch (e) {
		strapi.log.error(e)
	}
}
async function updateRoute(documentId, data) {
	try {
		const entity = await strapi.documents(waRoute).update({
			documentId: documentId,
			data: {
				...data,
			},
		})
		return entity
	} catch (e) {
		strapi.log.error(e)
	}
}
async function deleteRoute(documentId) {
	try {
		await strapi.documents(waRoute).delete({
			documentId: documentId,
		})
		return true
	} catch (e) {
		strapi.log.error(e)
		return false
	}
}
export { createExternalRoute, updateRoute, deleteRoute }
