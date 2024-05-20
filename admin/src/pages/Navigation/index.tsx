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
import Delete from '../../components/modals/Delete';
import NavEdit from '../../components/modals/NavEdit';
import EmptyNav from '../Navigation/EmptyNav';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import Header from './Header';
import { NavItem, Route } from '../../types';
import useNavigations from '../../hooks/useNavigations';
import ItemOverview from '../../components/modals/ItemOverview';
import RouteItem from './RouteItem';
import isNavItem from '../../utils/isNavItem';

const Navigation = () => {
  const [navigations, fetchNavigations] = useNavigations() as [NavItem[], () => Promise<void>];
  const [openModal, setOpenModal] = useState('');
  const [selectedNavigation, setSelectedNavigation] = useState<NavItem>();
  const [actionItem, setActionItem] = useState<NavItem | Route>();
  const [parentId, setParentId] = useState<number>();

  useEffect(() => {
    if (openModal === 'overview' || openModal === '') {
      setActionItem(undefined)
      setParentId(undefined)
    }
  }, [openModal]);

  useEffect(() => {
    if (Array.isArray(navigations) && navigations?.length > 0)
      setSelectedNavigation(navigations[0])
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
              <Button variant="secondary" startIcon={<Plus />} onClick={() => setOpenModal('ItemCreate')}>
                New Item
              </Button>
              <Button startIcon={<Check />} >
                Save
              </Button>
            </Flex>
            {selectedNavigation && selectedNavigation.items?.length > 0 &&
              <Flex direction="column" alignItems="stretch" gap={4}>
                {selectedNavigation.items.map((item, index) => (
                  <RouteItem key={index} item={item} setParentId={setParentId} setActionItem={setActionItem}/>
                ))}
              </Flex>
            }
            {navigations?.length === 0 && <EmptyNav msg="You don't have any navigations..." buttonText='Create new navigation' modal="create"/>}
            {selectedNavigation?.items?.length === 0 && <EmptyNav msg="Your navigation is empty..." buttonText='Create new item' modal="ItemCreate"/>}
          </ContentLayout>
        </Layout>
        {(openModal === 'ItemCreate' || openModal === 'ItemEdit') && selectedNavigation && <ItemOverview variant={openModal} fetchNavigations={fetchNavigations} navigation={selectedNavigation} parentId={parentId}/>}
        {openModal === 'overview' && <NavOverview navigations={navigations} setActionItem={setActionItem}/>}
        {openModal === 'create' && <NavCreate fetchNavigations={fetchNavigations}/>}
        {openModal === 'edit' && actionItem && isNavItem(actionItem) && <NavEdit item={actionItem} fetchNavigations={fetchNavigations}/>}
        {(openModal === 'NavDelete' || openModal === 'ItemDelete') && actionItem && <Delete variant={openModal} item={actionItem} fetchNavigations={fetchNavigations}/>}
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;
