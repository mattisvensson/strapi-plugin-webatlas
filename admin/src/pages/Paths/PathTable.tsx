import type { Route } from '../../../../types'
import type { RouteSortKey } from '../../types'
import { Table, Tbody, EmptyStateLayout, Tr, Td } from '@strapi/design-system'
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
}: {
	routes: Route[]
	sortKey: RouteSortKey
	sortDirection: 'asc' | 'desc'
	handleSort: (key: RouteSortKey) => void
	singleTypeUids: Set<string>
}) {
	const { formatMessage } = useIntl()

	const TABLE_COL_COUNT = 4

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
						/>
					))
				) : (
					<Tr>
						<Td colSpan={TABLE_COL_COUNT}>
							<EmptyStateLayout
								shadow="none"
								content={formatMessage({
									id: getTranslation('paths.page.emptyPaths'),
									defaultMessage: 'No paths found',
								})}
							/>
						</Td>
					</Tr>
				)}
			</Tbody>
		</Table>
	)
}

export default PathTable
