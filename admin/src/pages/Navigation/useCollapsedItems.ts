import { useCallback, useEffect, useState } from 'react'
import { PLUGIN_ID } from '../../../../utils'

const getStorageKey = (navigationDocumentId: string) =>
	`${PLUGIN_ID}:navigation:${navigationDocumentId}:collapsed`

/**
 * Removes the remembered collapsed items of a navigation, e.g. when the navigation is deleted.
 */
export function removeCollapsedItems(navigationDocumentId: string) {
	localStorage.removeItem(getStorageKey(navigationDocumentId))
}

/**
 * Collapsed items of a navigation, remembered per navigation in the localStorage of the browser.
 */
export default function useCollapsedItems(navigationDocumentId: string | undefined) {
	// The navigation is stored with the ids, so ids are never written to the key of another navigation
	const [collapsed, setCollapsed] = useState<{ navigationDocumentId?: string; ids: Set<string> }>({
		ids: new Set(),
	})

	useEffect(() => {
		if (!navigationDocumentId) return

		let ids: string[] = []
		try {
			ids = JSON.parse(localStorage.getItem(getStorageKey(navigationDocumentId)) ?? '[]')
		} catch (error) {
			console.error('Error reading collapsed navigation items: ', error)
		}
		setCollapsed({ navigationDocumentId, ids: new Set(ids) })
	}, [navigationDocumentId])

	useEffect(() => {
		if (!collapsed.navigationDocumentId) return

		localStorage.setItem(
			getStorageKey(collapsed.navigationDocumentId),
			JSON.stringify([...collapsed.ids]),
		)
	}, [collapsed])

	const updateCollapsedIds = useCallback((update: (ids: Set<string>) => Set<string>) => {
		setCollapsed((current) => {
			const ids = update(current.ids)
			return ids === current.ids ? current : { ...current, ids }
		})
	}, [])

	const toggleCollapsed = useCallback(
		(documentId: string) =>
			updateCollapsedIds((ids) => {
				const nextIds = new Set(ids)
				if (!nextIds.delete(documentId)) nextIds.add(documentId)
				return nextIds
			}),
		[updateCollapsedIds],
	)

	const expand = useCallback(
		(documentId: string) =>
			updateCollapsedIds((ids) => {
				if (!ids.has(documentId)) return ids
				const nextIds = new Set(ids)
				nextIds.delete(documentId)
				return nextIds
			}),
		[updateCollapsedIds],
	)

	const setCollapsedIds = useCallback(
		(ids: Set<string>) => updateCollapsedIds(() => ids),
		[updateCollapsedIds],
	)

	return { collapsedIds: collapsed.ids, toggleCollapsed, expand, setCollapsedIds }
}
