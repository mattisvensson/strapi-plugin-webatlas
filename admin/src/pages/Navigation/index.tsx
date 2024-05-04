/*
 *
 * Navigation
 *
 */

import { Plus, Check } from '@strapi/icons';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Flex, Button } from '@strapi/design-system';
import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import NavOverview from '../../components/modals/NavOverview';
import NavCreate from '../../components/modals/NavCreate';
import MainModal from '../../components/modals/MainModal';
import NavDelete from '../../components/modals/NavDelete';
import EmptyNav from '../Navigation/EmptyNav';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import Header from './Header';
import { NavItem } from '../../types';

const Navigation = () => {
  const { get } = useFetchClient();

  const [navigations, setNavigations] = useState([]);
  const [openModal, setOpenModal] = useState('');
  const [selectedNavigation, setSelectedNavigation] = useState<NavItem>();
  const [actionNavigation, setActionNavigation] = useState<NavItem>();

  useEffect(() => {
    if (openModal !== 'overview') return
     
    async function getRoutes () {
      const { data } = await get('/content-manager/collection-types/plugin::url-routes.navigation')
      console.log(data.results)
      setNavigations(data.results)
    }
    getRoutes();
  }, [openModal])

  useEffect(() => {
    if (navigations.length > 0) {
      setSelectedNavigation(navigations[0]);
    }
  }, [navigations]);
  
  return (
    <ModalContext.Provider value={[openModal, setOpenModal]}>
      <SelectedNavigationContext.Provider value={[selectedNavigation, setSelectedNavigation]}>
        <Layout>
          <HeaderLayout
            title='Navigation'
            subtitle='Manage your navigation settings here'
            primaryAction={<Header navigations={navigations}/>}
          />
          <ContentLayout>
            <Flex gap={4} paddingBottom={6} justifyContent="flex-end">
              {openModal === 'overview' && 
                <MainModal 
                  body={<NavOverview navigations={navigations} setActionNavigation={setActionNavigation}/>}
                  title="Navigation overview"
                  startAction={<Button onClick={() => setOpenModal('')} variant="tertiary">Cancel</Button>}
                  endAction={<Button onClick={() => setOpenModal('create')}>Create new</Button>}
                />
              }
              {openModal === 'create' &&
                <MainModal 
                  body={<NavCreate/>}
                  title="Create new navigation"
                  startAction={<Button onClick={() => setOpenModal('overview')} variant="tertiary">Cancel</Button>}
                  endAction={<Button onClick={() => setOpenModal('create')}>Create</Button>}
                />
              }
              {openModal === 'delete' && actionNavigation &&
                <NavDelete item={actionNavigation}/>
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
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;
