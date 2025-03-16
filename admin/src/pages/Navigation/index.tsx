/*
 *
 * Navigation
 *
 */

import { Plus, Check } from '@strapi/icons';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Flex, Button } from '@strapi/design-system';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import NavOverview from '../../components/modals/NavOverview';
import NavCreate from '../../components/modals/NavCreate';
import Delete from '../../components/modals/Delete';
import NavEdit from '../../components/modals/NavEdit';
import EmptyNav from './EmptyNav';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import Header from './Header';
import { NestedNavigation, NestedNavItem } from '../../../../types';
import useNavigations from '../../hooks/useNavigations';
import useApi from '../../hooks/useApi';
import { isNestedNavigation, isNestedNavItem} from '../../utils/typeChecks';
import { ItemCreate } from '../../components/modals/internalItem/internalItemCreate';
import { ItemEdit } from '../../components/modals/internalItem/internalItemEdit';
import { ExternalItem } from '../../components/modals/externalItem/externalItem';
import { WrapperItem } from '../../components/modals/wrapperItem/wrapperItem';
import {
  DndContext,
  closestCenter,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getProjection } from '../../utils/dnd';
import SortableRouteItem from './SortableRouteItem';

type Projected = {
  depth: number;
  maxDepth: number;
  minDepth: number;
}

const Navigation = () => {
  const { navigations, fetchNavigations } = useNavigations();
  const [modal, setModal] = useState<string>('');
  const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>();
  const [navigationItems, setNavigationItems] = useState<NestedNavItem[]>();
  const [initialNavigationItems, setInitialNavigationItems] = useState<NestedNavItem[]>();
  const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>();
  const [parentId, setParentId] = useState<number>();
  const { getStructuredNavigation, updateNavItem } = useApi();

  const [projected, setProjected] = useState<Projected | null>(null);
  const [activeItem, setActiveItem] = useState<NestedNavItem | undefined>();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const indentationWidth = 48;

  if (!navigations) return null;

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
      const { items } = await getStructuredNavigation(id, 'flat')
      setNavigationItems(items)
    }
    if (Array.isArray(navigations) && navigations?.length > 0)
      fetchNestedNavigation()
  }, [navigations, selectedNavigation]);

  useEffect(() => {
    if (!selectedNavigation && navigations.length > 0)
      setSelectedNavigation(navigations[0])
  }, [navigations]);

  useEffect(() => {
    if (navigationItems && !initialNavigationItems) {
      setInitialNavigationItems(navigationItems)
    }
  }, [navigationItems]);

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
    if (!navigationItems) return;

    setActiveId(activeId);
    setOverId(activeId);

    document.body.style.setProperty('cursor', 'grabbing');
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
  }

  function handleDragCancel() {
    resetState();
  }
  
  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    resetState();

    if (projected && over && navigationItems) {
      const { depth } = projected;

      const overIndex = navigationItems.findIndex(({ id }) => id === over.id);
      const activeIndex = navigationItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = navigationItems[activeIndex];

      navigationItems[activeIndex] = { ...activeTreeItem, depth };

      const sortedItems = arrayMove(navigationItems, activeIndex, overIndex);

      setNavigationItems(sortedItems);
    }
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty('cursor', '');
  }

  function saveOrder() {
    if (!navigationItems || !selectedNavigation) return

    let groupIndices: number[] = [0];
    let parentIds: number[] = [0];
    
    navigationItems.forEach((item, index) => {
      const previousItem = navigationItems[index - 1];

      if (typeof item.depth !== 'number') return

      if (item.depth === 0) {
        parentIds = [0];
        groupIndices[0] = (groupIndices[0] || 0) + 1;
      } else if (typeof previousItem.depth === 'number' && item.depth === previousItem.depth + 1) {
        parentIds.push(previousItem.id);
        groupIndices[item.depth] = 0;
      } else if (typeof previousItem.depth === 'number' && item.depth <= previousItem.depth) {
        const diff = previousItem.depth - item.depth;
        for (let i = 0; i < diff; i++) {
          parentIds.pop();
          groupIndices.pop();
        }

        groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
      }
      
      updateNavItem({
        order: groupIndices[item.depth],
        parent: parentIds.at(-1) || null,
        route: item.route.id,
        navigation: selectedNavigation.id
      }, item.id);
    });
    
    setInitialNavigationItems(navigationItems)
  }
  
  useEffect(() => {
    if (!activeId || !navigationItems) return

    const item = navigationItems.find(({ id }) => id === activeId);
    setActiveItem(item);
  }, [navigationItems, activeId])

  useEffect(() => {
    const projection =
      activeId && overId
        ? getProjection(
          navigationItems,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
        : null;

    setProjected(projection);
  }, [activeId, overId, offsetLeft, navigationItems]);

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
              <Button
                startIcon={<Check />}
                onClick={() => saveOrder()}
                disabled={JSON.stringify(navigationItems) === JSON.stringify(initialNavigationItems)}
              >
                Save
              </Button>
            </Flex>
            {navigationItems && navigationItems.length > 0 &&
              <Flex direction="column" alignItems="stretch" gap={4}>
                <DndContext
                  collisionDetection={(e) => closestCenter(e)}
                  onDragStart={(e) => handleDragStart(e)}
                  onDragMove={(e) => handleDragMove(e)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDragEnd={(e) => handleDragEnd(e)}
                  onDragCancel={() => handleDragCancel()}
                  measuring={measuring}
                >
                  <SortableContext items={navigationItems} strategy={verticalListSortingStrategy}>
                    {navigationItems.map((item, index) => (
                      <SortableRouteItem
                        key={index} 
                        item={item} 
                        setParentId={setParentId} 
                        setActionItem={setActionItem} 
                        indentationWidth={indentationWidth}
                        depth={item.id === activeId && projected ? projected.depth : item.depth}
                      />
                    ))}
                    {createPortal(
                      <DragOverlay>
                        {activeId && activeItem ? (
                          <SortableRouteItem
                            item={activeItem} 
                            setParentId={setParentId} 
                            setActionItem={setActionItem} 
                          />
                        ) : null}
                      </DragOverlay>,
                      document.body
                    )}
                  </SortableContext>
                </DndContext>
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
        {modal === 'ItemCreate' && <ItemCreate parentId={parentId}/>}
        {modal === 'ItemEdit' && isNestedNavItem(actionItem) && <ItemEdit item={actionItem}/>}
        {modal === 'ExternalCreate' && <ExternalItem variant={modal} parentId={parentId}/>}
        {modal === 'ExternalEdit' && isNestedNavItem(actionItem) && <ExternalItem variant={modal} item={actionItem}/>}
        {modal === 'WrapperCreate' && <WrapperItem variant={modal} parentId={parentId}/>}
        {modal === 'WrapperEdit' && isNestedNavItem(actionItem) && <WrapperItem variant={modal} item={actionItem}/>}
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;