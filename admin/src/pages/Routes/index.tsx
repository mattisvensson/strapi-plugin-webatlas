/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
*/

import type { Route } from '../../../../types';
import { useState, useEffect } from 'react';
import { Table, Tbody, Box, Grid, Field, EmptyStateLayout, Tr, Td } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useApi } from '../../hooks';
import { FullLoader } from '../../components/UI';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import { useNotification } from '@strapi/strapi/admin'
import PageWrapper from './PageWrapper';
import { useSearchParams } from 'react-router-dom';

function SearchInput({
  searchQuery,
  handleSearchChange
}: {
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {

  const { formatMessage } = useIntl();

  return (
    <Grid.Root style={{ marginBottom: '16px' }}>
      <Grid.Item col={4} s={12}>
        <Box width="100%">
          <Field.Root>
            <Field.Input
              name="search"
              placeholder={formatMessage({
                id: getTranslation('routes.page.searchPlaceholder'),
                defaultMessage: 'Search routes',
              })}
              value={searchQuery}
              onChange={handleSearchChange}
              endAction={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                    style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Clear search"
                  >
                    <Cross />
                  </button>
                ) : null
              }
            />
          </Field.Root>
        </Box>
      </Grid.Item>
    </Grid.Root>
  );
}

function RouteTable({ routes }: { routes: Route[] }) {
  
  const { formatMessage } = useIntl();

  return (
    <Table colCount={4} rowCount={routes.length}>
      <TableHeader />
      <Tbody>
        {routes.length > 0 ? routes.map((route: Route) => (
          <TableRow key={route.id} route={route} />
        )) : 
          <Tr>
            <Td colSpan={4}>
              <EmptyStateLayout 
                content={
                  formatMessage({
                    id: getTranslation('routes.page.emptyRoutes'),
                    defaultMessage: 'No routes found',
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

const Routes = () => {
  const { getRoutes } = useApi();
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    setRoutes(
      allRoutes.filter((route) =>
        JSON.stringify(route.id).toLowerCase().includes(query) ||
        route.title.toLowerCase().includes(query) ||
        route.fullPath.toLowerCase().includes(query) ||
        route.relatedDocumentId.toLowerCase().includes(query) ||
        route.relatedContentType.toLowerCase().includes(query)
      )
    )
  }, [searchQuery, allRoutes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value);
    value ?
      setSearchParams({ search: value })
      : setSearchParams({});
  }

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const data = await getRoutes();
        setAllRoutes(data);
        setRoutes(data);
      } catch (err) {
        console.error('Failed to fetch routes:', err);
        toggleNotification({
          type: 'danger',
          message: formatMessage({
            id: getTranslation('notification.routes.fetchFailed'),
            defaultMessage: 'Failed to fetch routes',
          }),
        });
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, [])

  if (loading) {
    return <PageWrapper>
      <FullLoader />
    </PageWrapper>
  }

  return (
    <PageWrapper>
      <SearchInput
        handleSearchChange={handleSearchChange}
        searchQuery={searchQuery}
      />
      <RouteTable
        routes={routes} 
      />
    </PageWrapper>
  );
};

export default Routes;