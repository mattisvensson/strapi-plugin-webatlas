/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
*/

import type { Route } from '../../../../types';
import { useState, useEffect } from 'react';
import { Table, Tbody } from '@strapi/design-system';
import { useApi } from '../../hooks';
import { EmptyBox, Center, FullLoader } from '../../components/UI';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import { useNotification } from '@strapi/strapi/admin'
import PageWrapper from './PageWrapper';

const Routes = () => {
  const { getRoutes } = useApi();
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const data = await getRoutes();
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

  if (routes.length === 0) {
    return <PageWrapper>
      <Center height={400}>
        <EmptyBox msg={formatMessage({
          id: getTranslation('routes.page.emptyRoutes'),
          defaultMessage: 'No routes found',
        })} />
      </Center>
    </PageWrapper>;
  }
  return (
    <PageWrapper>
      <Table colCount={4} rowCount={routes.length}>
        <TableHeader />
        <Tbody>
          {routes.map((route: Route) => (
            <TableRow key={route.id} route={route} />
          ))}
        </Tbody>
      </Table>
    </PageWrapper>
  );
};

export default Routes;