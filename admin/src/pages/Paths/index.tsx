/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
 */

import type { Route } from '../../../../types'
import type { RouteSortKey } from '../../types'
import { useState, useEffect } from 'react'
import { useApi, useErrorMessage } from '../../hooks'
import useAllContentTypes from '../../hooks/useAllContentTypes'
import { FullLoader } from '../../components/UI'
import { getTranslation, isAbortError } from '../../utils'
import { useIntl } from 'react-intl'
import { useNotification, Page, Pagination } from '@strapi/strapi/admin'
import PageWrapper from './PageWrapper'
import { useSearchParams } from 'react-router-dom'
import debounce from '../../utils/debounce'
import { useMemo } from 'react'
import compareBy from './compareBy'
import pluginPermissions from '../../permissions'
import SearchInput from './SearchInput'
import PathTable from './PathTable'

const DEFAULT_PAGE_SIZE = 20

const Paths = () => {
	const { getAllRoutes } = useApi()
	const { formatMessage } = useIntl()
	const { toggleNotification } = useNotification()
	const getErrorMessage = useErrorMessage()
	const { contentTypes } = useAllContentTypes()

	const [allRoutes, setAllRoutes] = useState<Route[]>([])
	const [routes, setRoutes] = useState<Route[]>([])
	const [loading, setLoading] = useState(true)
	const [searchParams, setSearchParams] = useSearchParams()
	const initialQuery = searchParams.get('search') || ''
	const [searchQuery, setSearchQuery] = useState(initialQuery)
	const [sortKey, setSortKey] = useState<RouteSortKey>('canonicalPath')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	useEffect(() => {
		const query = searchQuery.toLowerCase()
		setRoutes(
			allRoutes.filter(
				(route) =>
					JSON.stringify(route.id).toLowerCase().includes(query) ||
					route.title.toLowerCase().includes(query) ||
					route.path.toLowerCase().includes(query) ||
					route.canonicalPath?.toLowerCase().includes(query) ||
					route.relatedDocumentId.toLowerCase().includes(query) ||
					route.relatedContentType.toLowerCase().includes(query),
			),
		)
	}, [searchQuery, allRoutes])

	const debouncedSetSearchParams = useMemo(
		() =>
			debounce((value: string) => {
				setSearchParams((prev) => {
					const next = new URLSearchParams(prev)
					value ? next.set('search', value) : next.delete('search')
					// A new search result starts on the first page, the page size is kept
					next.delete('page')
					return next
				})
			}, 300),
		[setSearchParams],
	)

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setSearchQuery(value)
		debouncedSetSearchParams(value)
	}

	useEffect(() => {
		async function fetchRoutes() {
			try {
				const data = await getAllRoutes()
				setAllRoutes(data)
				setRoutes(data)
			} catch (err) {
				if (isAbortError(err)) return

				console.error('Failed to fetch paths:', err)
				toggleNotification({
					type: 'danger',
					message: getErrorMessage(
						err,
						formatMessage({
							id: getTranslation('notification.paths.fetchFailed'),
							defaultMessage: 'Failed to fetch paths',
						}),
					),
				})
			} finally {
				setLoading(false)
			}
		}
		fetchRoutes()
	}, [])

	const handleSort = (key: RouteSortKey) => {
		setSortDirection((prev) => (key === sortKey && prev === 'asc' ? 'desc' : 'asc'))
		setSortKey(key)
	}

	const singleTypeUids = useMemo(
		() => new Set(contentTypes.filter((ct) => ct.kind === 'singleType').map((ct) => ct.uid)),
		[contentTypes],
	)

	const sortedRoutes = useMemo(() => {
		return sortKey ? [...routes].sort(compareBy(sortKey, sortDirection)) : routes
	}, [routes, sortKey, sortDirection])

	const pageSize = Math.max(1, Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE)
	const pageCount = Math.max(1, Math.ceil(sortedRoutes.length / pageSize))
	// Clamp, so a stale or manually edited page param never shows an empty table
	const page = Math.min(Math.max(1, Number(searchParams.get('page')) || 1), pageCount)

	const paginatedRoutes = useMemo(
		() => sortedRoutes.slice((page - 1) * pageSize, page * pageSize),
		[sortedRoutes, page, pageSize],
	)

	if (loading) {
		return (
			<PageWrapper>
				<FullLoader />
			</PageWrapper>
		)
	}

	return (
		<Page.Protect permissions={pluginPermissions['page.routes']}>
			<PageWrapper>
				<SearchInput handleSearchChange={handleSearchChange} searchQuery={searchQuery} />
				<PathTable
					routes={paginatedRoutes}
					sortKey={sortKey}
					sortDirection={sortDirection}
					handleSort={handleSort}
					singleTypeUids={singleTypeUids}
				/>
				<Pagination.Root
					pageCount={pageCount}
					total={sortedRoutes.length}
					defaultPageSize={DEFAULT_PAGE_SIZE}
				>
					<Pagination.PageSize />
					<Pagination.Links />
				</Pagination.Root>
			</PageWrapper>
		</Page.Protect>
	)
}

export default Paths
