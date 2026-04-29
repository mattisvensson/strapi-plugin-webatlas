import { waNavItem } from '../../../utils'
async function createNavItem(data) {
	try {
		if (!data.route || !data.navigation) return null
		const entity = await strapi.documents(waNavItem).create({
			data: {
				navigation: data.navigation,
				route: data.route || null,
				parent: data.parent || null,
				order: data.order || 0,
			},
		})
		return entity
	} catch (e) {
		strapi.log.error(e)
	}
}
async function updateNavItem(documentId, data) {
	try {
		const updateData = {}
		if (data.parent !== undefined) updateData.parent = data.parent
		if (data.order !== undefined && typeof data.order === 'number') updateData.order = data.order
		return await strapi.documents(waNavItem).update({
			documentId: documentId,
			data: updateData,
		})
	} catch (e) {
		strapi.log.error(e)
	}
}
async function deleteNavItem(documentId) {
	try {
		await strapi.documents(waNavItem).delete({
			documentId: documentId,
		})
		return true
	} catch (e) {
		strapi.log.error(e)
	}
}
export { createNavItem, updateNavItem, deleteNavItem }
