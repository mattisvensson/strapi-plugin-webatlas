import type { UID } from '@strapi/strapi'
import type { NestedNavItem } from '../../../types'

/**
 * Removes navigation items whose route points to an entry without a published version, so titles and
 * paths of unpublished pages are not exposed. External and wrapper routes are not linked to an entry
 * and are kept. Descendants of removed items are removed as well, since they would be orphaned.
 */
export default async function removeUnpublishedNavItems(
	items: NestedNavItem[],
): Promise<NestedNavItem[]> {
	// Group the linked entries by content type to fetch them with one query per content type
	const documentIdsByUid = new Map<string, string[]>()
	for (const { route } of items) {
		if (!route?.relatedContentType) continue
		const documentIds = documentIdsByUid.get(route.relatedContentType) ?? []
		documentIds.push(route.relatedDocumentId)
		documentIdsByUid.set(route.relatedContentType, documentIds)
	}

	const publishedDocumentIds = new Set<string>()
	for (const [uid, documentIds] of documentIdsByUid) {
		// Routes of content types that no longer exist are treated as unpublished
		if (!strapi.contentTypes[uid]) continue

		const entries = await strapi.documents(uid as UID.ContentType).findMany({
			filters: { documentId: { $in: documentIds } },
			fields: ['documentId'],
			status: 'published',
		})
		entries.forEach((entry) => publishedDocumentIds.add(entry.documentId))
	}

	const removedItemIds = new Set(
		items
			.filter(
				({ route }) =>
					route?.relatedContentType && !publishedDocumentIds.has(route.relatedDocumentId),
			)
			.map((item) => item.documentId),
	)

	// The items are not ordered by depth, so repeat until no further descendant is found
	let foundDescendant = removedItemIds.size > 0
	while (foundDescendant) {
		foundDescendant = false
		for (const item of items) {
			if (
				item.parent &&
				removedItemIds.has(item.parent.documentId) &&
				!removedItemIds.has(item.documentId)
			) {
				removedItemIds.add(item.documentId)
				foundDescendant = true
			}
		}
	}

	return items.filter((item) => !removedItemIds.has(item.documentId))
}
