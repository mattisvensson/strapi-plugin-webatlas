/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
*/

import { useState, useEffect } from 'react';
import { Layouts } from '@strapi/strapi/admin';
import { Flex, Typography, Table, Thead, Tbody, Tr, Td, Th, VisuallyHidden, LinkButton } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { Route } from '../../../../types';
import { useApi } from '../../hooks';
import { EmptyBox, Center } from '../../components/UI';
import { getTranslation, getRouteType } from '../../utils';
import { useIntl } from 'react-intl';

const Routes = () => {
  const { getRoutes } = useApi();
  const { formatMessage } = useIntl();

  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    async function fetchRoutes() {
      const data = await getRoutes();
      setRoutes(data);
    }
    fetchRoutes();
  }, [])

  return (
    <>
      <Layouts.Header
        title={formatMessage({
          id: getTranslation('routes.page.title'),
          defaultMessage: 'Routes',
        })}
        subtitle={formatMessage({
          id: getTranslation('routes.page.subtitle'),
          defaultMessage: 'Overview of all existing routes',
        })}
      />
      <Layouts.Content>
        {routes.length === 0 ? (
          <Center height={400}>
            <EmptyBox msg={formatMessage({
              id: getTranslation('routes.page.emptyRoutes'),
              defaultMessage: 'No routes found',
            })} />
          </Center>
        ) : (
          <Table colCount={4} rowCount={routes.length}>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant="sigma">ID</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">
                    {formatMessage({
                      id: getTranslation('title'),
                      defaultMessage: 'Title',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">
                    {formatMessage({
                      id: getTranslation('route'),
                      defaultMessage: 'Route',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">
                    {formatMessage({
                      id: getTranslation('routes.page.column.type'),
                      defaultMessage: 'Type',
                    })}
                  </Typography>
                </Th>
                <Th>
                  <VisuallyHidden>
                    {formatMessage({
                      id: getTranslation('actions'),
                      defaultMessage: 'Actions',
                    })}
                  </VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {routes.map((route: Route) => (
                <Tr key={route.id}>
                  <Td>
                    <Typography textColor="neutral800">{route.id}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">{route.title}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">{route.fullPath}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">
                      {formatMessage({
                        id: getTranslation(`route.type.${getRouteType(route)}`),
                        defaultMessage: '-',
                      })}
                    </Typography>
                  </Td>
                  <Td>
                    <Flex gap={2} justifyContent="end">
                      {route.internal && 
                        <LinkButton
                          variant="secondary"
                          startIcon={<Pencil />} 
                          href={`/admin/content-manager/collection-types/${route.relatedContentType}/${route.relatedDocumentId}`}
                        >
                          {formatMessage({
                            id: getTranslation('edit'),
                            defaultMessage: 'Edit',
                          })}
                        </LinkButton>
                      }
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Layouts.Content>
    </>
  );
};

export default Routes;