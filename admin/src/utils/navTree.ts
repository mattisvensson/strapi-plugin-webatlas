import type { UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { NestedNavItem } from '../../../types'

// All helpers work on the flat, depth-annotated item list, where parents precede their children

/**
 * Returns the documentIds of all items that have at least one child.
 */
export function getItemsWithChildren(items: NestedNavItem[]): Set<string> {
	const itemsWithChildren = new Set<string>()
	items.forEach((item, index) => {
		const nextItem = items[index + 1]
		if (nextItem && (nextItem.depth ?? 0) > (item.depth ?? 0))
			itemsWithChildren.add(item.documentId)
	})
	return itemsWithChildren
}

/**
 * Returns the items without the descendants of collapsed items.
 */
export function getCollapsedVisibleItems(
	items: NestedNavItem[],
	collapsedIds: Set<string>,
): NestedNavItem[] {
	let hiddenBelowDepth: number | null = null

	return items.filter((item) => {
		const depth = item.depth ?? 0
		if (hiddenBelowDepth !== null && depth > hiddenBelowDepth) return false

		hiddenBelowDepth = collapsedIds.has(item.documentId) ? depth : null
		return true
	})
}

/**
 * Returns the items whose title or path contains the query, together with all their ancestors.
 */
export function getSearchVisibleItems(items: NestedNavItem[], query: string): NestedNavItem[] {
	const normalizedQuery = query.trim().toLowerCase()
	const ancestors: NestedNavItem[] = []
	const visibleItems = new Set<NestedNavItem>()

	items.forEach((item) => {
		const depth = item.depth ?? 0
		ancestors.length = Math.min(ancestors.length, depth)

		const title = item.clientModifications?.title || item.route?.title || ''
		const path = item.clientModifications?.path || item.route?.path || ''
		if (
			title.toLowerCase().includes(normalizedQuery) ||
			path.toLowerCase().includes(normalizedQuery)
		) {
			ancestors.forEach((ancestor) => visibleItems.add(ancestor))
			visibleItems.add(item)
		}

		ancestors.push(item)
	})

	return items.filter((item) => visibleItems.has(item))
}

// Parent and ordered children of every item, the root items have the parent ''
function getTreeStructure(items: NestedNavItem[]) {
	const parentById = new Map<string, string>()
	const childrenByParent = new Map<string, string[]>()
	const ancestors: NestedNavItem[] = []

	items.forEach((item) => {
		const depth = item.depth ?? 0
		ancestors.length = Math.min(ancestors.length, depth)

		const parentId = ancestors[depth - 1]?.documentId ?? ''
		parentById.set(item.documentId, parentId)
		const children = childrenByParent.get(parentId) ?? []
		children.push(item.documentId)
		childrenByParent.set(parentId, children)

		ancestors.push(item)
	})

	return { parentById, childrenByParent }
}

/**
 * Returns the documentIds of the items that were moved compared to the initial items: their depth
 * changed, or their position among the siblings they had before and still have changed. Siblings that
 * were added, removed or moved to another parent do not count, so the remaining siblings are not
 * marked just because they shift.
 */
export function getMovedItemIds(
	initialItems: NestedNavItem[],
	items: NestedNavItem[],
): Set<string> {
	const initial = getTreeStructure(initialItems)
	const current = getTreeStructure(items)
	const initialDepthById = new Map(initialItems.map((item) => [item.documentId, item.depth ?? 0]))
	const movedItemIds = new Set<string>()

	items.forEach((item) => {
		const initialDepth = initialDepthById.get(item.documentId)
		if (initialDepth !== undefined && initialDepth !== (item.depth ?? 0)) {
			movedItemIds.add(item.documentId)
		}
	})

	current.childrenByParent.forEach((children, parentId) => {
		const isKeptSibling = (id: string) =>
			initial.parentById.get(id) === parentId && current.parentById.get(id) === parentId
		const initialKeptChildren = (initial.childrenByParent.get(parentId) ?? []).filter(isKeptSibling)
		const keptChildren = children.filter(isKeptSibling)

		keptChildren.forEach((id, index) => {
			if (initialKeptChildren[index] !== id) movedItemIds.add(id)
		})
	})

	return movedItemIds
}

/**
 * Returns how many levels the descendants of the item reach below it, 0 if it has no children.
 */
export function getSubtreeDepth(items: NestedNavItem[], index: number): number {
	const depth = items[index].depth ?? 0
	let maxDepth = depth

	for (let i = index + 1; i < items.length && (items[i].depth ?? 0) > depth; i++) {
		maxDepth = Math.max(maxDepth, items[i].depth ?? 0)
	}

	return maxDepth - depth
}

/**
 * Returns the number of descendants of the item, including grandchildren.
 */
export function getDescendantCount(items: NestedNavItem[], index: number): number {
	const depth = items[index].depth ?? 0
	let end = index + 1
	while (end < items.length && (items[end].depth ?? 0) > depth) end++

	return end - index - 1
}

/**
 * Returns the closest item above the given item with a lower depth.
 */
export function getParentItem(
	items: NestedNavItem[],
	id: UniqueIdentifier,
): NestedNavItem | undefined {
	const index = items.findIndex((item) => item.id === id)
	if (index === -1) return undefined

	const depth = items[index].depth ?? 0
	for (let i = index - 1; i >= 0; i--) {
		if ((items[i].depth ?? 0) < depth) return items[i]
	}

	return undefined
}

/**
 * Moves the active item to the position of the over item and gives it the new depth. Positions refer
 * to the visible items: every visible item is moved together with the hidden items that follow it,
 * so a collapsed item takes its children along while the children of an expanded item stay in place.
 */
export function moveNavItem(
	items: NestedNavItem[],
	visibleItems: NestedNavItem[],
	activeId: UniqueIdentifier,
	overId: UniqueIdentifier,
	depth: number,
): NestedNavItem[] {
	const indexById = new Map(items.map((item, index) => [item.id, index]))
	const blocks = visibleItems.map((item, index) => {
		const nextVisibleItem = visibleItems[index + 1]
		const end = nextVisibleItem ? indexById.get(nextVisibleItem.id) : items.length
		return items.slice(indexById.get(item.id), end)
	})

	const activeIndex = visibleItems.findIndex(({ id }) => id === activeId)
	const overIndex = visibleItems.findIndex(({ id }) => id === overId)
	if (activeIndex === -1 || overIndex === -1) return items

	const depthDelta = depth - (blocks[activeIndex][0].depth ?? 0)
	if (depthDelta !== 0) {
		blocks[activeIndex] = blocks[activeIndex].map((item) => ({
			...item,
			depth: (item.depth ?? 0) + depthDelta,
		}))
	}

	// Fix potential depth issues: start at the root and never skip a level
	let previousDepth = -1
	return arrayMove(blocks, activeIndex, overIndex)
		.flat()
		.map((item) => {
			const itemDepth = Math.max(0, Math.min(item.depth ?? 0, previousDepth + 1))
			previousDepth = itemDepth
			return itemDepth === item.depth ? item : { ...item, depth: itemDepth }
		})
}
