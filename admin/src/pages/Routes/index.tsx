/*
 *
 * Routes
 *
 */

import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { Flex } from '@strapi/design-system/Flex';
import { Typography } from '@strapi/design-system';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Table, Thead, Tbody, Tr, Td, Th, VisuallyHidden, LinkButton, Button } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { Route } from '../../../../types';

const Routes = () => {
  const { get } = useFetchClient();

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function getRoutes() {
      const { data } = await get('/url-routes/route')
      setRoutes(data)
    }
    getRoutes();
  }, [])

  return (
    <Layout>
      <HeaderLayout
        title='Routes'
        subtitle='Overview of all existing routes'
      />
      <ContentLayout>
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
      </ContentLayout>
    </Layout>
  );
};

export default Routes;
