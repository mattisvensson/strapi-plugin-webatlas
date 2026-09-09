import type { UID } from '@strapi/strapi'
import type { Route, RouteSettings } from '../../../types'
import { waRoute } from '../../../utils/'

async function createExternalRoute(data: RouteSettings) {
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
}

async function updateRoute(documentId: string, data: RouteSettings): Promise<Route> {
	return (await strapi.documents(waRoute).update({
		documentId: documentId,
		data: {
			...data,
		},
	})) as Route
}

async function deleteRoute(documentId: string) {
	await strapi.documents(waRoute).delete({
		documentId: documentId,
	})

	return true
}

export { createExternalRoute, updateRoute, deleteRoute }
