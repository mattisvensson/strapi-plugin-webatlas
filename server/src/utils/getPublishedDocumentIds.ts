import type { UID } from '@strapi/strapi'

type LinkedRoute = { relatedContentType?: string; relatedDocumentId?: string } | null | undefined

/**
 * Returns the documentIds of the entries linked to the given routes that have a published version,
 * fetched with one query per content type. External and wrapper routes are not linked to an entry and
 * are ignored. Entries of content types that no longer exist are never returned.
 */
export default async function getPublishedDocumentIds(routes: LinkedRoute[]): Promise<Set<string>> {
	const documentIdsByUid = new Map<string, string[]>()
	for (const route of routes) {
		if (!route?.relatedContentType) continue
		const documentIds = documentIdsByUid.get(route.relatedContentType) ?? []
		documentIds.push(route.relatedDocumentId)
		documentIdsByUid.set(route.relatedContentType, documentIds)
	}

	const publishedDocumentIds = new Set<string>()
	for (const [uid, documentIds] of documentIdsByUid) {
		if (!strapi.contentTypes[uid]) continue

		const entries = await strapi.documents(uid as UID.ContentType).findMany({
			filters: { documentId: { $in: documentIds } },
			fields: ['documentId'],
			status: 'published',
		})
		entries.forEach((entry) => publishedDocumentIds.add(entry.documentId))
	}

	return publishedDocumentIds
}
