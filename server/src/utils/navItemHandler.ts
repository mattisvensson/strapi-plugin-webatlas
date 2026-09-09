import type { UID } from '@strapi/strapi'
import type { NavItemSettings, NestedNavItem, Route } from '../../../types'
import { waNavItem } from '../../../utils'

async function createNavItem(data: NavItemSettings): Promise<null | NestedNavItem> {
	if (!data.route || !data.navigation) return null

	const entity = await strapi.documents(waNavItem).create({
		data: {
			navigation: data.navigation,
			route: data.route || null,
			parent: data.parent || null,
			order: data.order || 0,
		},
	})

	return entity as NestedNavItem
}

async function updateNavItem(documentId: string, data: Pick<NavItemSettings, 'parent' | 'order'>) {
	const updateData: Partial<Pick<NavItemSettings, 'parent' | 'order'>> = {}
	if (data.parent !== undefined) updateData.parent = data.parent
	if (data.order !== undefined && typeof data.order === 'number') updateData.order = data.order

	return await strapi.documents(waNavItem).update({
		documentId: documentId,
		data: updateData,
	})
}

async function deleteNavItem(documentId: string) {
	await strapi.documents(waNavItem).delete({
		documentId: documentId,
	})

	return true
}

export { createNavItem, updateNavItem, deleteNavItem }
