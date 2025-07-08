/*
 *
 * Routes
 * This file contains the Routes page of the Webatlas plugin for Strapi.
 * It displays a table of all existing routes with their details and allows editing.
 *
*/

import { useState, useEffect } from 'react';
import { useFetchClient, Layouts } from '@strapi/strapi/admin';
import { Flex, Typography, Table, Thead, Tbody, Tr, Td, Th, VisuallyHidden, LinkButton } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { Route } from '../../../../types';

const Routes = () => {
  const { get } = useFetchClient();

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function getRoutes() {
      const { data } = await get('/webatlas/route')
      setRoutes(data)
    }
    getRoutes();
  }, [])

  return (
    <>
      <Layouts.Header
        title='Routes'
        subtitle='Overview of all existing routes'
      />
      <Layouts.Content>
        <Table colCount={6} rowCount={routes.length}>
          <Thead>
            <Tr>
              <Th>
                <Typography variant="sigma">ID</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Title</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Route</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Internal</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Active</Typography>
              </Th>
              <Th>
                <VisuallyHidden>Actions</VisuallyHidden>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {routes.map((route: Route) => <Tr key={route.id}>
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
                <Typography textColor="neutral800">{route.internal ? 'Yes' : 'No'}</Typography>
              </Td>
              <Td>
                <Typography textColor="neutral800">{route.active ? 'Yes' : 'No'}</Typography>
              </Td>
              <Td>
                <Flex gap={2} justifyContent="end">
                  {/* <Button variant="secondary">More info</Button> */}
                  <LinkButton variant="secondary" startIcon={<Pencil />} href={`/admin/content-manager/collection-types/${route.relatedContentType}/${route.relatedId}`}>Edit</LinkButton>
                </Flex>
              </Td>
            </Tr>)}
          </Tbody>
        </Table>
      </Layouts.Content>
    </>
  );
};

export default Routes;