/*
 *
 * Navigation
 *
 */

import { Plus, Check, EmptyDocuments } from '@strapi/icons';
import { Button } from '@strapi/design-system/Button';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Flex, Box, Typography } from '@strapi/design-system';
import {
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';

const EmptyNav = () => {
  return (
    <Flex direction="column" minHeight="400px" justifyContent="center">
      <EmptyDocuments width="10rem" height="6rem"/>
      <Box padding={4}>
        <Typography variant="beta" textColor="neutral600">Your navigation is empty...</Typography>
      </Box>
      <Button
        variant='secondary'
        startIcon={<Plus/>}
        label="Label"
        // onClick={addNewNavigationItem}
      >
        New item
      </Button>
    </Flex>
  )
}

const Header = ({ navigations }) => {

  const [selectedNavigation, setSelectedNavigation] = useState(navigations[0]?.slug);

  return (
    <Flex gap={4}>
      <Button variant="secondary">
        Manage
      </Button>
      <SingleSelect required value={selectedNavigation} placeholder="Select Navigation" error={false} disabled={navigations.length === 0}>
        {navigations.map((nav) => (
          <SingleSelectOption value={nav.slug}>{nav.name}</SingleSelectOption>
        ))}
      </SingleSelect>
    </Flex>
  )
}

const Navigation = () => {
  const { get } = useFetchClient();

  const [navigations, setNavigations] = useState([]);

  useEffect(() => {
    async function getRoutes () {
      const { data } = await get('/content-manager/collection-types/plugin::url-routes.navigation')
      console.log(data.results)
      setNavigations(data.results)
    }
    getRoutes();
  }, [])
  
  return (
    <Layout>
      <HeaderLayout
        title='Navigation'
        subtitle='Manage your navigation settings here'
        primaryAction={<Header navigations={navigations}/>}
      />
      <ContentLayout>
        <Flex gap={4} paddingBottom={6} justifyContent="flex-end">
          <Button variant="secondary" startIcon={<Plus />} >
            New Item
          </Button>
          <Button startIcon={<Check />} >
            Save
          </Button>
        </Flex>
        {navigations.length === 0 && <EmptyNav/>}
      </ContentLayout> 
    </Layout>
  );
};

export default Navigation;
