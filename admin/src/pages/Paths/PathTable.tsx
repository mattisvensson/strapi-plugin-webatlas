import type { Route } from '../../../../types';
import type { RouteSortKey } from '../../types';
import { Table, Tbody, EmptyStateLayout, Tr, Td } from '@strapi/design-system';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

function PathTable({
  routes, 
  sortKey, 
  handleSort
}: { 
  routes: Route[], 
  sortKey: RouteSortKey, 
  handleSort: (key: RouteSortKey) => void
}) {
  
  const { formatMessage } = useIntl();

  const TABLE_COL_COUNT = 5;

  return (
    <Table
      colCount={TABLE_COL_COUNT}
      rowCount={routes.length}
    >
      <TableHeader sortKey={sortKey} handleSort={handleSort} />
      <Tbody>
        {routes.length > 0 ? routes.map((route: Route) => (
          <TableRow key={route.id} route={route} />
        )) : 
          <Tr>
            <Td colSpan={TABLE_COL_COUNT}>
              <EmptyStateLayout 
                content={
                  formatMessage({
                    id: getTranslation('paths.page.emptyPaths'),
                    defaultMessage: 'No paths found',
                  })
                } 
                shadow={false}
              />
            </Td>
          </Tr>
        }
      </Tbody>
    </Table>
  )
}

export default PathTable;