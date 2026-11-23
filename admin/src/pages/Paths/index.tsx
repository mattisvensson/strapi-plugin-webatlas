/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
 */

import type { Route } from '../../../../types'
import type { RouteFilterKey, RouteSortKey } from '../../types'
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
import hasPathDeviation from './hasPathDeviation'
import pluginPermissions from '../../permissions'
import SearchInput from './SearchInput'
import PathTable from './PathTable'
import PathFilters from './PathFilters'
import { Box, Flex } from '@strapi/design-system'

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
	const [sortKey, setSortKey] = useState<RouteSortKey>('path')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	// Filters live in the URL only, so filtered views can be shared and survive a reload
	const contentTypeFilter = searchParams.getAll('contentType')
	const contentTypeFilterKey = contentTypeFilter.join(',')
	const typeFilter = searchParams.get('type')
	const deviationFilter = searchParams.get('deviation')
	const navigationFilter = searchParams.get('navigation')

	useEffect(() => {
		const query = searchQuery.toLowerCase()
		setRoutes(
			allRoutes.filter(
				(route) =>
					(contentTypeFilter.length === 0 ||
						contentTypeFilter.includes(route.relatedContentType)) &&
					(!typeFilter || route.type === typeFilter) &&
					(!deviationFilter || String(hasPathDeviation(route)) === deviationFilter) &&
					(!navigationFilter || String(!!route.navitem?.length) === navigationFilter) &&
					(JSON.stringify(route.id).toLowerCase().includes(query) ||
						route.title.toLowerCase().includes(query) ||
						route.path.toLowerCase().includes(query) ||
						route.canonicalPath?.toLowerCase().includes(query) ||
						route.relatedDocumentId.toLowerCase().includes(query) ||
						route.relatedContentType.toLowerCase().includes(query)),
			),
		)
	}, [searchQuery, allRoutes, contentTypeFilterKey, typeFilter, deviationFilter, navigationFilter])

	const handleFilterChange = (key: RouteFilterKey, values: string[]) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev)
			next.delete(key)
			values.filter(Boolean).forEach((value) => next.append(key, value))
			// A new filter result starts on the first page, the page size is kept
			next.delete('page')
			return next
		})
	}

	const handleResetFilters = () => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev)
			const filterKeys: RouteFilterKey[] = ['contentType', 'type', 'deviation', 'navigation']
			filterKeys.forEach((key) => next.delete(key))
			next.delete('page')
			return next
		})
	}

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

	// Only content types that actually have routes, external and wrapper routes have none
	const contentTypeOptions = useMemo(() => {
		const uids = [...new Set(allRoutes.map((route) => route.relatedContentType).filter(Boolean))]
		return uids
			.map((uid) => ({
				uid,
				label: contentTypes.find((ct) => ct.uid === uid)?.info.displayName ?? uid,
			}))
			.sort((a, b) => a.label.localeCompare(b.label))
	}, [allRoutes, contentTypes])

	const hasActiveFilters =
		contentTypeFilter.length > 0 || !!typeFilter || !!deviationFilter || !!navigationFilter
	const isFiltered = !!searchQuery || hasActiveFilters

	const handleClearSearch = () => {
		setSearchQuery('')
		debouncedSetSearchParams('')
	}

	const contentTypeLabels = useMemo(
		() => new Map(contentTypeOptions.map((option) => [option.uid, option.label])),
		[contentTypeOptions],
	)

	const sortedRoutes = useMemo(() => {
		return sortKey ? [...routes].sort(compareBy(sortKey, sortDirection, contentTypeLabels)) : routes
	}, [routes, sortKey, sortDirection, contentTypeLabels])

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
			<PageWrapper total={allRoutes.length} matches={isFiltered ? routes.length : undefined}>
				<Flex gap={2} wrap="wrap" marginBottom={4}>
					{/* Extra spacing separates the free text search from the structured filters */}
					<Box width="320px" marginRight={4}>
						<SearchInput handleSearchChange={handleSearchChange} searchQuery={searchQuery} />
					</Box>
					<PathFilters
						contentTypeOptions={contentTypeOptions}
						selectedContentTypes={contentTypeFilter}
						type={typeFilter}
						deviation={deviationFilter}
						navigation={navigationFilter}
						handleFilterChange={handleFilterChange}
						handleResetFilters={handleResetFilters}
					/>
				</Flex>
				<PathTable
					routes={paginatedRoutes}
					sortKey={sortKey}
					sortDirection={sortDirection}
					handleSort={handleSort}
					singleTypeUids={singleTypeUids}
					contentTypeLabels={contentTypeLabels}
					hasSearch={!!searchQuery}
					hasActiveFilters={hasActiveFilters}
					handleClearSearch={handleClearSearch}
					handleResetFilters={handleResetFilters}
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
