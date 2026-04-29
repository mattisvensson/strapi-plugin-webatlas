import type { NestedNavItem } from '../../../types'

/**
 * Finds the parent navigation item of a given target item in a flat, depth-annotated array.
 *
 * @param navigationItems - Flat array of NestedNavItem, ordered such that parents precede children.
 * @param targetItem - The item whose parent is to be found. Must have a valid depth property.
 * @returns The parent NestedNavItem if found, otherwise null.
 */
export default function findParentNavItem({
	navigationItems,
	targetItem,
	onlyInternalItems = false,
}: {
	navigationItems?: NestedNavItem[] | null
	targetItem: NestedNavItem
	onlyInternalItems?: boolean
}): NestedNavItem | null {
	if (!navigationItems || !Array.isArray(navigationItems)) return null
	if (!targetItem || typeof targetItem.depth !== 'number' || targetItem.depth <= 0) return null

	const targetIndex = navigationItems.findIndex(
		(navItem) => navItem.documentId === targetItem.documentId,
	)
	if (targetIndex === -1) return null

	for (let i = targetIndex - 1; i >= 0; i--) {
		const candidate = navigationItems[i]

		if (candidate.depth === 0) {
			if (onlyInternalItems && candidate.route.type !== 'internal') {
				return null
			}
			return candidate
		}

		if (
			candidate.clientModifications?.type === 'delete' ||
			(typeof candidate.depth === 'number' && candidate.depth >= targetItem.depth) ||
			(onlyInternalItems && candidate.route.type !== 'internal')
		) {
			continue
		}
		return candidate
	}

	return null
}
