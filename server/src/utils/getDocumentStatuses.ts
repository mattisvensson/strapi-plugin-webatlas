import type { UID } from '@strapi/strapi'
import { contentTypes } from '@strapi/utils'

type LinkedRoute = { relatedContentType?: string; relatedDocumentId?: string } | null | undefined
type DocumentStatus = 'published' | 'draft' | 'modified'

/**
 * Returns the content manager status of the entries linked to the given routes, keyed by documentId,
 * fetched with two queries per content type. Entries of content types without draft and publish have
 * no status, like in the content manager. External and wrapper routes are ignored.
 */
export default async function getDocumentStatuses(
	routes: LinkedRoute[],
): Promise<Map<string, DocumentStatus>> {
	const documentIdsByUid = new Map<string, string[]>()
	for (const route of routes) {
		if (!route?.relatedContentType || !route.relatedDocumentId) continue
		const documentIds = documentIdsByUid.get(route.relatedContentType) ?? []
		documentIds.push(route.relatedDocumentId)
		documentIdsByUid.set(route.relatedContentType, documentIds)
	}

	const statuses = new Map<string, DocumentStatus>()
	for (const [uid, documentIds] of documentIdsByUid) {
		const contentType = strapi.contentTypes[uid]
		if (!contentType || !contentTypes.hasDraftAndPublish(contentType)) continue

		const query = {
			filters: { documentId: { $in: documentIds } },
			fields: ['documentId', 'updatedAt'],
		}
		const [drafts, published] = await Promise.all([
			strapi.documents(uid as UID.ContentType).findMany({ ...query, status: 'draft' }),
			strapi.documents(uid as UID.ContentType).findMany({ ...query, status: 'published' }),
		])

		const publishedUpdatedAt = new Map(
			published.map((entry) => [entry.documentId, new Date(entry.updatedAt).getTime()]),
		)
		drafts.forEach((draft) => {
			const publishedAt = publishedUpdatedAt.get(draft.documentId)
			if (publishedAt === undefined) return statuses.set(draft.documentId, 'draft')

			// Same rule as the content manager: modified if the draft was updated after the published version
			const isModified = new Date(draft.updatedAt).getTime() > publishedAt
			statuses.set(draft.documentId, isModified ? 'modified' : 'published')
		})
	}

	return statuses
}
