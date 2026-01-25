/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
*/

import type { Route } from '../../../../types';
import type { RouteSortKey } from '../../types';
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks';
import { FullLoader } from '../../components/UI';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { useNotification, Page } from '@strapi/strapi/admin'
import PageWrapper from './PageWrapper';
import { useSearchParams } from 'react-router-dom';
import debounce from '../../utils/debounce';
import { useMemo } from 'react';
import compareBy from './compareBy';
import pluginPermissions from '../../permissions';
import SearchInput from './SearchInput';
import PathTable from './PathTable';

const Paths = () => {
  const { getRoutes } = useApi();
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortKey, setSortKey] = useState<RouteSortKey>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    setRoutes(
      allRoutes.filter((route) =>
        JSON.stringify(route.id).toLowerCase().includes(query) ||
        route.title.toLowerCase().includes(query) ||
        route.path.toLowerCase().includes(query) ||
        route.relatedDocumentId.toLowerCase().includes(query) ||
        route.relatedContentType.toLowerCase().includes(query)
      )
    )
  }, [searchQuery, allRoutes]);

  const debouncedSetSearchParams = useMemo(() =>
    debounce((value: string) => {
      value
        ? setSearchParams({ search: value })
        : setSearchParams({});
    }, 300),
  [setSearchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value);
    debouncedSetSearchParams(value);
  }

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const data = await getRoutes();
        setAllRoutes(data);
        setRoutes(data);
      } catch (err) {
        console.error('Failed to fetch paths:', err);
        toggleNotification({
          type: 'danger',
          message: formatMessage({
            id: getTranslation('notification.paths.fetchFailed'),
            defaultMessage: 'Failed to fetch paths',
          }),
        });
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, [])

  const handleSort = (key: RouteSortKey) => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    setSortKey(key);
  };

  const sortedRoutes = useMemo(() => {
    return sortKey
      ? [...routes].sort(compareBy(sortKey, sortDirection))
      : routes;
  }, [routes, sortKey, sortDirection]);

  if (loading) {
    return <PageWrapper>
      <FullLoader />
    </PageWrapper>
  }

  return (
    <Page.Protect permissions={pluginPermissions['page.routes']}>
      <PageWrapper>
        <SearchInput
          handleSearchChange={handleSearchChange}
          searchQuery={searchQuery}
        />
        <PathTable
          routes={sortedRoutes} 
          sortKey={sortKey}
          handleSort={handleSort}
        />
      </PageWrapper>
    </Page.Protect>
  );
};

export default Paths;