export default function reduceDepthOfOrphanedItems(navigationItems, itemId) {
	const navigationItemsCopy = JSON.parse(JSON.stringify(navigationItems))
	const startItemIndex = navigationItemsCopy.findIndex((item) => item.documentId === itemId)
	if (startItemIndex === -1) return
	const startItem = navigationItemsCopy[startItemIndex]
	// Start from the item after the deleted one
	for (let i = startItemIndex + 1; i < navigationItemsCopy.length; i++) {
		const currentItem = navigationItemsCopy[i]
		if (!currentItem) continue
		if (currentItem.depth === 0) break // Stop if we reach a top-level item
		if (currentItem.depth > startItem.depth) {
			currentItem.depth = Math.max(0, currentItem.depth - 1)
		} else {
			break // Stop if we reach an item that is not a child
		}
	}
	navigationItemsCopy.splice(startItemIndex, 1) // Remove the deleted item
	return navigationItemsCopy
}
