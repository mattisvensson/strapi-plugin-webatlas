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
import { NestedNavigation, NestedNavItem } from '../../../../types';
import useNavigations from '../../hooks/useNavigations';
import ItemOverview from '../../components/modals/ItemOverview';
import RouteItem from './RouteItem';
import useApi from '../../hooks/useApi';
import { isNestedNavigation, isNestedNavItem} from '../../utils/typeChecks';

const Navigation = () => {
  const [navigations, fetchNavigations] = useNavigations() as [NestedNavigation[], () => Promise<void>];
  const [openModal, setOpenModal] = useState('');
  const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>();
  const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>();
  const [parentId, setParentId] = useState<number>();
  const { getNestedNavigation } = useApi();

  useEffect(() => {
    if (openModal === 'overview' || openModal === '') {
      setActionItem(undefined)
      setParentId(undefined)
    }
  }, [openModal]);

  useEffect(() => {
    async function fetchNestedNavigation () {
      const nestedNav = await getNestedNavigation(navigations[0].id)
      setSelectedNavigation(nestedNav)
    }
    if (Array.isArray(navigations) && navigations?.length > 0)
      fetchNestedNavigation()
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
        {(openModal === 'ItemCreate' || openModal === 'ItemEdit') && isNestedNavItem(actionItem) && selectedNavigation && <ItemOverview variant={openModal} item={actionItem} fetchNavigations={fetchNavigations} navigation={selectedNavigation} parentId={parentId}/>}
        {openModal === 'overview' && isNestedNavigation(actionItem) && <NavOverview navigations={navigations} setActionItem={setActionItem}/>}
        {openModal === 'create' && <NavCreate fetchNavigations={fetchNavigations}/>}
        {openModal === 'edit' && isNestedNavigation(actionItem) && <NavEdit item={actionItem} fetchNavigations={fetchNavigations}/>}
        {openModal === "NavDelete" && isNestedNavigation(actionItem) &&<Delete variant="NavDelete" item={actionItem} fetchNavigations={fetchNavigations}/>}
        {openModal === "ItemDelete" && isNestedNavItem(actionItem) && <Delete variant="ItemDelete" item={actionItem} fetchNavigations={fetchNavigations}/>}      
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;
