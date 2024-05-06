/*
 *
 * Navigation
 *
 */

import { Plus, Check } from '@strapi/icons';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Flex, Button } from '@strapi/design-system';
import { useEffect, useState } from 'react';
import NavOverview from '../../components/modals/NavOverview';
import NavCreate from '../../components/modals/NavCreate';
import NavDelete from '../../components/modals/NavDelete';
import NavEdit from '../../components/modals/NavEdit';
import EmptyNav from '../Navigation/EmptyNav';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import Header from './Header';
import { NavItem } from '../../types';
import useNavigations from '../../hooks/useNavigations';

const Navigation = () => {

  const [navigations, fetchNavigations] = useNavigations() as [NavItem[], () => Promise<void>];
  const [openModal, setOpenModal] = useState('');
  const [selectedNavigation, setSelectedNavigation] = useState<NavItem>();
  const [actionNavigation, setActionNavigation] = useState<NavItem>();

  useEffect(() => {
    if (Array.isArray(navigations) && navigations.length > 0) {
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
              <Button variant="secondary" startIcon={<Plus />} >
                New Item
              </Button>
              <Button startIcon={<Check />} >
                Save
              </Button> 
            </Flex>
            {navigations?.length === 0 && <EmptyNav msg="You don't have any navigations..." buttonText='Create new navigation' modal="create"/>}
            {selectedNavigation?.items.length === 0 && <EmptyNav msg="Your navigation is empty..." buttonText='Create new item' modal="ItemCreate"/>}
          </ContentLayout> 
        </Layout>
        {openModal === 'overview' && <NavOverview navigations={navigations} setActionNavigation={setActionNavigation}/>}
        {openModal === 'create' && <NavCreate fetchNavigations={fetchNavigations}/>}
        {openModal === 'edit' && actionNavigation && <NavEdit item={actionNavigation} fetchNavigations={fetchNavigations}/>}
        {openModal === 'delete' && actionNavigation && <NavDelete item={actionNavigation} fetchNavigations={fetchNavigations}/>}
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;
