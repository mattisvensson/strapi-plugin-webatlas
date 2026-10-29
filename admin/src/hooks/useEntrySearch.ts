import { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import type { ConfigContentType, Entity } from '../../../types'
import { isAbortError } from '../utils'

const PAGE_SIZE = 20
const SEARCH_DELAY = 300

/**
 * Searches the entries of a content type page by page through the content manager, so content types
 * with many entries never have to be loaded completely. Sorted by the route source field.
 */
export default function useEntrySearch(contentType: ConfigContentType | undefined, query: string) {
	const { get } = useFetchClient()
	// get is not stable between renders, a ref keeps it out of the dependencies
	const getRef = useRef(get)
	getRef.current = get

	const [entries, setEntries] = useState<Entity[]>([])
	const [page, setPage] = useState(1)
	const [pageCount, setPageCount] = useState(0)
	const [loading, setLoading] = useState(false)
	const [hasError, setHasError] = useState(false)
	// Responses of outdated requests (previous query or content type) are ignored
	const requestIdRef = useRef(0)

	const fetchPage = useCallback(
		async (nextPage: number) => {
			if (!contentType?.routeSourceField) return

			const requestId = ++requestIdRef.current
			setLoading(true)
			setHasError(false)

			try {
				const params = new URLSearchParams({
					page: String(nextPage),
					pageSize: String(PAGE_SIZE),
					sort: `${contentType.routeSourceField}:ASC`,
				})
				if (query.trim()) params.set('_q', query.trim())

				const { data } = await getRef.current(
					`/content-manager/collection-types/${contentType.uid}?${params}`,
				)
				if (requestId !== requestIdRef.current) return

				setEntries((current) => (nextPage === 1 ? data.results : [...current, ...data.results]))
				setPage(nextPage)
				setPageCount(data.pagination?.pageCount ?? 0)
			} catch (error) {
				if (requestId !== requestIdRef.current || isAbortError(error)) return
				console.error('Error searching entries: ', error)
				setHasError(true)
			} finally {
				if (requestId === requestIdRef.current) setLoading(false)
			}
		},
		[contentType, query],
	)

	useEffect(() => {
		// Invalidates running requests already while the search delay runs
		requestIdRef.current++
		setEntries([])
		setPageCount(0)
		const timeout = setTimeout(() => fetchPage(1), query ? SEARCH_DELAY : 0)
		return () => clearTimeout(timeout)
	}, [fetchPage])

	return {
		entries,
		loading,
		hasError,
		hasMore: page < pageCount,
		loadMore: () => fetchPage(page + 1),
	}
}
