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
import ItemCreate from '../../components/modals/ItemCreate';
import ItemEdit from '../../components/modals/ItemEdit';
import RouteItem from './RouteItem';
import useApi from '../../hooks/useApi';
import { isNestedNavigation, isNestedNavItem} from '../../utils/typeChecks';

const Navigation = () => {
  const [navigations, fetchNavigations] = useNavigations() as [NestedNavigation[], () => Promise<void>];
  const [openModal, setOpenModal] = useState('');
  const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>();
  const [navigationItems, setNavigationItems] = useState<NestedNavItem[]>();
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

  const renderModal = () => {
    if (!selectedNavigation) return
    if (openModal === 'ItemCreate' ) {
        return (
          <ItemCreate
            fetchNavigations={fetchNavigations}
            navigation={selectedNavigation}
            parentId={parentId}
          />
        );
    } else if (openModal === 'ItemEdit') {
      if ((isNestedNavItem(actionItem) || actionItem === undefined) && selectedNavigation) {
        return (
          <ItemEdit
            item={actionItem}
            fetchNavigations={fetchNavigations}
            navigation={selectedNavigation}
            parentId={parentId}
          />
        );
      }
    } else if (openModal === 'overview') {
      return <NavOverview navigations={navigations} setActionItem={setActionItem} />;
    } else if (openModal === 'create') {
      return <NavCreate fetchNavigations={fetchNavigations} />;
    } else if (openModal === 'edit' && isNestedNavigation(actionItem)) {
      return <NavEdit item={actionItem} fetchNavigations={fetchNavigations} />;
    } else if (openModal === "NavDelete" && isNestedNavigation(actionItem)) {
      return <Delete variant="NavDelete" item={actionItem} fetchNavigations={fetchNavigations} />;
    } else if (openModal === "ItemDelete" && isNestedNavItem(actionItem)) {
      return <Delete variant="ItemDelete" item={actionItem} fetchNavigations={fetchNavigations} />;
    }
    return null;
  };

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
            {navigationItems && navigationItems.length > 0 &&
              <Flex direction="column" alignItems="stretch" gap={4}>
                {navigationItems.map((item, index) => (
                  <RouteItem key={index} item={item} setParentId={setParentId} setActionItem={setActionItem}/>
                ))}
              </Flex>
            }
            {navigations?.length === 0 && <EmptyNav msg="You don't have any navigations..." buttonText='Create new navigation' modal="create"/>}
            {selectedNavigation?.items?.length === 0 && <EmptyNav msg="Your navigation is empty..." buttonText='Create new item' modal="ItemCreate"/>}
          </ContentLayout>
        </Layout>
        {renderModal()}
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;
