/*
 *
 * Navigation
 * This file contains the main logic for the Navigation page in the Strapi admin panel.
 * It handles the display and management of navigations, including creating, editing, and deleting navigation items.
 * It also supports drag-and-drop reordering of navigation items.
 *
*/

import { Plus, Check } from '@strapi/icons';
import { Flex, Button } from '@strapi/design-system';
import { Layouts } from '@strapi/strapi/admin';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavOverview, NavCreate, Delete, NavEdit, ItemCreate, ItemEdit, ExternalItem, WrapperItem, NavModal } from '../../components/modals';
import { EmptyBox, Center } from '../../components/UI';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import Header from './Header';
import { NestedNavigation, NestedNavItem } from '../../../../types';
import useNavigations from '../../hooks/useNavigations';
import useApi from '../../hooks/useApi';
// import { isNestedNavigation, isNestedNavItem} from '../../utils/typeChecks';
import {
  DndContext,
  closestCenter,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getProjection, measuring, indentationWidth } from '../../utils/dnd';
import SortableRouteItem from './SortableRouteItem';

type Projected = {
  depth: number;
  maxDepth: number;
  minDepth: number;
}

const Navigation = () => {
  const { navigations, fetchNavigations } = useNavigations();
  const [modalType, setModalType] = useState<string>('');
  const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>();
  const [navigationItems, setNavigationItems] = useState<NestedNavItem[]>();
  const [initialNavigationItems, setInitialNavigationItems] = useState<NestedNavItem[]>();
  const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>();
  const [parentId, setParentId] = useState<string | undefined>();
  const { getStructuredNavigation, updateNavItem } = useApi();

  const [projected, setProjected] = useState<Projected | null>(null);
  const [activeItem, setActiveItem] = useState<NestedNavItem | undefined>();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  if (!navigations) return null;

  useEffect(() => {
    if (modalType === 'NavOverview' || modalType === '') {
      setActionItem(undefined)
      setParentId(undefined)
      fetchNavigations()
    }
  }, [modalType]);

  useEffect(() => {
    async function fetchNestedNavigation () {
      if (!selectedNavigation && (!navigations || navigations.length === 0)) return
      
      const documentId = selectedNavigation?.documentId ?? navigations?.[0]?.documentId;
      
      if (!documentId) return
      
      const { items } = await getStructuredNavigation(documentId, 'flat')
      setNavigationItems(items)
    }
    if (Array.isArray(navigations) && navigations?.length > 0)
      fetchNestedNavigation()
  }, [navigations, selectedNavigation]);

  useEffect(() => {
    if (navigations.length > 0 && (!selectedNavigation || !navigations.find(nav => nav.id === selectedNavigation.id))) {
      setSelectedNavigation(navigations[0])
    }
  }, [navigations]);

  useEffect(() => {
    if (navigationItems && !initialNavigationItems) {
      setInitialNavigationItems(navigationItems)
    }
  }, [navigationItems]);


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
    let parentIds: string[] = [];
    
    navigationItems.forEach((item, index) => {
      const previousItem = navigationItems[index - 1];

      if (typeof item.depth !== 'number') return

      if (item.depth === 0) {
        groupIndices[0] = (groupIndices[0] || 0) + 1;
        parentIds = [];
      } else if (typeof previousItem.depth === 'number' && item.depth === previousItem.depth + 1) {
        parentIds.push(previousItem.documentId);
        groupIndices[item.depth] = 0;
      } else if (typeof previousItem.depth === 'number' && item.depth <= previousItem.depth) {
        const diff = previousItem.depth - item.depth;
        for (let i = 0; i < diff; i++) {
          parentIds.pop();
          groupIndices.pop();
        }

        groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
      }
 
      updateNavItem(item.documentId, {
        order: groupIndices[item.depth],
        parent: parentIds.at(-1) || '',
        route: item?.route?.documentId || '',
        navigation: selectedNavigation?.documentId || ''
      });
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
        )
        : null;

    setProjected(projection);
  }, [activeId, overId, offsetLeft, navigationItems]);

  return (
    <ModalContext.Provider value={{modalType, setModalType}}>
      <SelectedNavigationContext.Provider value={{selectedNavigation, setSelectedNavigation}}>
        <>
          <Layouts.Header
            title='Navigation'
            subtitle='Manage your navigation settings here'
            primaryAction={<Header navigations={navigations}/>}
          />
          <Layouts.Content>
            <Flex gap={4} paddingBottom={6} justifyContent="flex-end">
              <Button variant="secondary" startIcon={<Plus />} onClick={() => setModalType('ItemCreate')}>
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
            {navigations?.length === 0 && <Center height={400}>
              <EmptyBox msg="You have no navigations yet..." />
              <Button variant="primary" onClick={() => setModalType('NavCreate')}>
                Create new Navigation
              </Button>
            </Center>}
            {navigationItems?.length === 0 && <Center height={400}>
              <EmptyBox msg="Your navigation is empty..." />
              <Button variant="primary" onClick={() => setModalType('ItemCreate')}>
                Create new item
              </Button>
            </Center>}
          </Layouts.Content>
        </>
        {modalType === 'NavOverview' && <NavOverview navigations={navigations} setActionItem={setActionItem} />}
        {modalType === 'NavCreate' && <NavCreate />}
        {modalType === "NavDelete"  && <Delete variant="NavDelete" item={actionItem as NestedNavigation} fetchNavigations={fetchNavigations} />}
        {modalType === 'NavEdit' && <NavEdit item={actionItem as NestedNavigation} fetchNavigations={fetchNavigations} />}
        {modalType === 'ItemCreate' && <ItemCreate parentId={parentId}/>}
        {modalType === "ItemDelete" && <Delete variant="ItemDelete" item={actionItem as NestedNavItem} fetchNavigations={fetchNavigations} />}
        {modalType === 'ItemEdit' && <ItemEdit item={actionItem as NestedNavItem}/>}
        {modalType === 'ExternalCreate' && <ExternalItem variant={modalType} parentDocumentId={parentId}/>}
        {modalType === 'ExternalEdit' && <ExternalItem variant={modalType} item={actionItem as NestedNavItem}/>}
        {modalType === 'WrapperCreate' && <WrapperItem variant={modalType} parentDocumentId={parentId}/>}
        {modalType === 'WrapperEdit' && <WrapperItem variant={modalType} item={actionItem as NestedNavItem}/>}
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;