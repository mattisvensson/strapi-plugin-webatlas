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
import RouteItem from './RouteItem';
import useApi from '../../hooks/useApi';
import { isNestedNavigation, isNestedNavItem} from '../../utils/typeChecks';
import ExternalCreate from '../../components/modals/ExternalCreate';
import { ItemCreate } from '../../components/modals/internalItem/internalItemCreate';
import { ItemEdit } from '../../components/modals/internalItem/internalItemEdit';

const Navigation = () => {
  const { navigations, fetchNavigations } = useNavigations();
  const [modal, setModal] = useState<string>('');
  const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>();
  const [navigationItems, setNavigationItems] = useState<NestedNavItem[]>();
  const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>();
  const [parentId, setParentId] = useState<number>();
  const { getNestedNavigation } = useApi();

  useEffect(() => {
    if (modal === 'overview' || modal === '') {
      setActionItem(undefined)
      setParentId(undefined)
      fetchNavigations()
    }
  }, [modal]);

  useEffect(() => {
    async function fetchNestedNavigation () {
      const id = selectedNavigation ? selectedNavigation.id : navigations[0].id
      const { items } = await getNestedNavigation(id)
      setNavigationItems(items)
    }
    if (Array.isArray(navigations) && navigations?.length > 0)
      fetchNestedNavigation()
  }, [navigations, selectedNavigation]);

  useEffect(() => {
    if (!selectedNavigation && navigations.length > 0)
      setSelectedNavigation(navigations[0])
  }, [navigations]);

  return (
    <ModalContext.Provider value={{modal, setModal}}>
      <SelectedNavigationContext.Provider value={{selectedNavigation, setSelectedNavigation}}>
        <Layout>
          <HeaderLayout
            title='Navigation'
            subtitle='Manage your navigation settings here'
            primaryAction={<Header navigations={navigations}/>}
          />
          <ContentLayout>
            <Flex gap={4} paddingBottom={6} justifyContent="flex-end">
              <Button variant="secondary" startIcon={<Plus />} onClick={() => setModal('ItemCreate')}>
                New Item
              </Button>
              <Button startIcon={<Check />} >
                Save
              </Button>
            </Flex>
            {navigationItems && navigationItems.length > 0 &&
              <Flex direction="column" alignItems="stretch" gap={4}>
                {navigationItems.map((item, index) => (
                  <RouteItem key={index} item={item} setParentId={setParentId} setActionItem={setActionItem}/>
                ))}
              </Flex>
            }
            {navigations?.length === 0 && <EmptyNav msg="You don't have any navigations..." buttonText='Create new navigation' modal="create"/>}
            {navigationItems?.length === 0 && <EmptyNav msg="Your navigation is empty..." buttonText='Add new item' modal="ItemCreate"/>}
          </ContentLayout>
        </Layout>
        {modal === 'overview' && <NavOverview navigations={navigations} setActionItem={setActionItem} />}
        {modal === 'create' && <NavCreate fetchNavigations={fetchNavigations} />}
        {modal === 'edit' && isNestedNavigation(actionItem) && <NavEdit item={actionItem} fetchNavigations={fetchNavigations} />}
        {modal === "NavDelete" && isNestedNavigation(actionItem) && <Delete variant="NavDelete" item={actionItem} fetchNavigations={fetchNavigations} />}
        {modal === "ItemDelete" && isNestedNavItem(actionItem) && <Delete variant="ItemDelete" item={actionItem} fetchNavigations={fetchNavigations} />}
        {modal === 'ItemCreate' && <ItemCreate variant={modal} parentId={parentId}/>}
        {modal === 'ItemEdit' && isNestedNavItem(actionItem) && <ItemEdit variant={modal} item={actionItem}/>}
        {modal === 'externalCreate' && <ExternalCreate fetchNavigations={fetchNavigations} parentId={parentId}/>}
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;
