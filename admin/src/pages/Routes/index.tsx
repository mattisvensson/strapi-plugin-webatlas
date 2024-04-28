/*
 *
 * Routes
 *
 */

import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { Flex } from '@strapi/design-system/Flex';
import { BaseCheckbox, Typography  } from '@strapi/design-system';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Table, Thead, Tbody, Tr, Td, Th, VisuallyHidden, IconButton } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { Link } from 'react-router-dom';

interface Route {
  id: number;
  title: string;
  path: string;
  menuAttached: boolean;
  createdAt: string;
  updatedAt: string;
  relatedContentType: string;
  relatedId: number;
}

const Routes = () => {
  const { get } = useFetchClient();

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function getRoutes () {
      const { data } = await get('/url-routes/route', {
        method: 'GET',
      })
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
                <BaseCheckbox aria-label="Select all entries" />
              </Th>
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
                <Typography variant="sigma">Attached to menu</Typography>
              </Th>
              <Th>
                <VisuallyHidden>Actions</VisuallyHidden>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {routes.map((route: Route) => <Tr key={route.id}>
                <Td>
                  <BaseCheckbox aria-label={`Select ${route.title}`} />
                </Td>
                <Td>
                  <Typography textColor="neutral800">{route.id}</Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">{route.title}</Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">{route.path}</Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">{route.menuAttached ? 'Yes' : 'No'}</Typography>
                </Td>
                <Td>
                  <Flex>
                      <Link to={`/content-manager/collection-types/${route.relatedContentType}/${route.relatedId}`}>
                        <>
                          <VisuallyHidden>Edit</VisuallyHidden>
                          <IconButton onClick={() => console.log('edit')} label="Edit" noBorder icon={<Pencil />} />
                        </>
                      </Link>
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
