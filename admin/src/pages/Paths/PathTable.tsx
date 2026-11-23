import type { Route } from '../../../../types'
import type { RouteSortKey } from '../../types'
import { Table, Tbody, EmptyStateLayout, Tr, Td, Flex, Button } from '@strapi/design-system'
import TableHeader from './TableHeader'
import TableRow from './TableRow'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../utils'

function PathTable({
	routes,
	sortKey,
	sortDirection,
	handleSort,
	singleTypeUids,
	contentTypeLabels,
	hasSearch,
	hasActiveFilters,
	handleClearSearch,
	handleResetFilters,
}: {
	routes: Route[]
	sortKey: RouteSortKey
	sortDirection: 'asc' | 'desc'
	handleSort: (key: RouteSortKey) => void
	singleTypeUids: Set<string>
	contentTypeLabels: Map<string, string>
	hasSearch: boolean
	hasActiveFilters: boolean
	handleClearSearch: () => void
	handleResetFilters: () => void
}) {
	const { formatMessage } = useIntl()

	const TABLE_COL_COUNT = 5

	return (
		<Table colCount={TABLE_COL_COUNT} rowCount={routes.length}>
			<TableHeader sortKey={sortKey} sortDirection={sortDirection} handleSort={handleSort} />
			<Tbody>
				{routes.length > 0 ? (
					routes.map((route: Route) => (
						<TableRow
							key={route.id}
							route={route}
							isSingleType={singleTypeUids.has(route.relatedContentType)}
							contentTypeLabel={contentTypeLabels.get(route.relatedContentType)}
						/>
					))
				) : (
					<Tr>
						<Td colSpan={TABLE_COL_COUNT}>
							{hasSearch || hasActiveFilters ? (
								<EmptyStateLayout
									shadow="none"
									content={formatMessage({
										id: getTranslation('paths.page.emptyFiltered'),
										defaultMessage: 'No paths match the current search or filters',
									})}
									action={
										<Flex gap={2}>
											{hasActiveFilters && (
												<Button variant="secondary" onClick={handleResetFilters}>
													{formatMessage({
														id: getTranslation('paths.page.filter.reset'),
														defaultMessage: 'Reset filters',
													})}
												</Button>
											)}
											{hasSearch && (
												<Button variant="secondary" onClick={handleClearSearch}>
													{formatMessage({
														id: getTranslation('paths.page.clearSearch'),
														defaultMessage: 'Clear search',
													})}
												</Button>
											)}
										</Flex>
									}
								/>
							) : (
								<EmptyStateLayout
									shadow="none"
									content={formatMessage({
										id: getTranslation('paths.page.emptyPaths'),
										defaultMessage: 'No paths found',
									})}
								/>
							)}
						</Td>
					</Tr>
				)}
			</Tbody>
		</Table>
	)
}

export default PathTable
