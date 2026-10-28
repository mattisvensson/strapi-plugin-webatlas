import type { NestedNavItem } from '../../../types'
import { getPublishedDocumentIds } from './'

/**
 * Removes navigation items whose route points to an entry without a published version, so titles and
 * paths of unpublished pages are not exposed. External and wrapper routes are not linked to an entry
 * and are kept. Descendants of removed items are removed as well, since they would be orphaned.
 */
export default async function removeUnpublishedNavItems(
	items: NestedNavItem[],
): Promise<NestedNavItem[]> {
	const publishedDocumentIds = await getPublishedDocumentIds(items.map((item) => item.route))

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
