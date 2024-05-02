/*
 *
 * Navigation
 *
 */

import { Plus, Check, EmptyDocuments } from '@strapi/icons';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Flex, Box, Typography, Button } from '@strapi/design-system';
import {
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import NavOverview from '../../components/modals/NavOverview';
import NavCreate from '../../components/modals/NavCreate';
import MainModal from '../../components/modals/MainModal';

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

const Header = ({ navigations, setIsVisible }) => {
  const [selectedNavigation, setSelectedNavigation] = useState(navigations[0]?.slug);

  return (
    <Flex gap={4}>
      <Button variant="secondary" onClick={() => setIsVisible('initial')}>
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
  const [isVisible, setIsVisible] = useState('');

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
        primaryAction={<Header navigations={navigations} setIsVisible={setIsVisible}/>}
      />
      <ContentLayout>
        <Flex gap={4} paddingBottom={6} justifyContent="flex-end">
          {/* {isVisible && <Modal navigations={navigations} isVisible={isVisible} setIsVisible={setIsVisible}/>} */}
          {isVisible === 'initial' &&
            <MainModal 
              setIsVisible={setIsVisible}
              body={<NavOverview navigations={navigations} setIsVisible={setIsVisible}/>}
              title="Navigation overview"
              startAction={<Button onClick={() => setIsVisible((prev: boolean) => !prev)} variant="tertiary">Cancel</Button>}
              endAction={<Button onClick={() => setIsVisible('create')}>Create new</Button>}
            />
          }
          {isVisible === 'create' &&
            <MainModal 
              setIsVisible={setIsVisible}
              body={<NavCreate/>}
              title="Create new navigation"
              startAction={<Button onClick={() => setIsVisible((prev: boolean) => !prev)} variant="tertiary">Cancel</Button>}
              endAction={<Button onClick={() => setIsVisible('create')}>Create</Button>}
            />
          }
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
