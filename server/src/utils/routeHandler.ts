import type { UID } from '@strapi/strapi'
import type { Route, RouteSettings } from '../../../types'
import { waRoute } from '../../../utils/'

async function createExternalRoute(data: RouteSettings) {
	try {
		return await strapi.documents(waRoute as UID.ContentType).create({
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

async function updateRoute(documentId: string, data: RouteSettings): Promise<Route> {
	try {
		const entity = (await strapi.documents(waRoute as UID.ContentType).update({
			documentId: documentId,
			data: {
				...data,
			},
		})) as Route

		return entity
	} catch (e) {
		strapi.log.error(e)
	}
}

async function deleteRoute(documentId: string) {
	try {
		await strapi.documents(waRoute as UID.ContentType).delete({
			documentId: documentId,
		})

		return true
	} catch (e) {
		strapi.log.error(e)
		return false
	}
}

export { createExternalRoute, updateRoute, deleteRoute }
