/*
 *
 * Navigation
 * This file contains the main logic for the Navigation page in the Strapi admin panel.
 * It handles the display and management of navigations, including creating, editing, and deleting navigation items.
 * It also supports drag-and-drop reordering of navigation items.
 *
*/

import { Plus } from '@strapi/icons';
import { Flex, Button } from '@strapi/design-system';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavOverview, NavCreate, Delete, NavEdit, ItemCreate, ItemEdit, ExternalItem, WrapperItem, NavModal } from '../../components/modals';
import { EmptyBox, Center, FullLoader } from '../../components/UI';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import type { NestedNavigation, NestedNavItem } from '../../../../types';
import useApi from '../../hooks/useApi';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { useNotification, useFetchClient } from '@strapi/strapi/admin'
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
import PageWrapper from './PageWrapper';
import cloneDeep from 'lodash/cloneDeep';
import { useParams, useNavigate  } from 'react-router-dom';

type Projected = {
  depth: number;
  maxDepth: number;
  minDepth: number;
}

const Navigation = () => {
  const [navigations, setNavigations] = useState<NestedNavigation[]>([]);
  const [modalType, setModalType] = useState<string>('');
  const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>();
  const [navigationItems, setNavigationItems] = useState<NestedNavItem[]>();
  const initialNavigationItemsRef = useRef<NestedNavItem[] | null>(null);
  const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>();
  const [parentId, setParentId] = useState<string | undefined>();
  const { getNavigation, updateNavigationItemStructure } = useApi();
  const [isSavingNavigation, setIsSavingNavigation] = useState(false);
  const [loading, setLoading] = useState(true);
  const cachedNavigations = useRef<NestedNavigation[] | null>(null);

  const [projected, setProjected] = useState<Projected | null>(null);
  const [activeItem, setActiveItem] = useState<NestedNavItem | undefined>();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get } = useFetchClient();
  const { navigationId } = useParams();
  const navigate = useNavigate();  

  async function loadNavigations() {
    try {
      const data = await getNavigation({ variant: 'flat' });
      const updatedNavigations = await Promise.all(
        data.map(async (nav: NestedNavigation) => {
          const updatedItems = await Promise.all(
            nav.items.map(async (item) => {
              const ct = item.route?.relatedContentType;
              const id = item.route?.relatedDocumentId;
              if (!ct || !id) return item;
              try {
                const { data } = await get(`/content-manager/collection-types/${ct}/${id}`);
                return { ...item, status: data.data.status };
              } catch (err) {
                console.error(err);
                return item;
              }
            })
          );
          return { ...nav, items: updatedItems };
        })
      );
      
      let selectedNav = updatedNavigations.find(nav => nav.documentId === navigationId);
      
      if (!selectedNav && navigationId) {
        selectedNav = updatedNavigations[0];

        toggleNotification({
          type: 'danger',
          message: formatMessage({
            id: getTranslation('notification.navigation.notFound'),
            defaultMessage: 'Navigation not found. Redirected to navigation',
          }) + ': ' + updatedNavigations[0]?.name,
        });
        navigate(`/plugins/webatlas/navigation/${updatedNavigations[0]?.documentId}`);
        return
      } 

      cachedNavigations.current = updatedNavigations;
      switchNavigation(selectedNav, updatedNavigations);
    } catch (error) {
      console.error('Error fetching navigations: ', error);
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('notification.navigation.fetchFailed'),
          defaultMessage: 'Failed to fetch navigations',
        }),
      });
    }
  }

  function switchNavigation(selectedNav: NestedNavigation, updatedNavigations: NestedNavigation[]) {
    setNavigations(updatedNavigations);
    setSelectedNavigation(selectedNav);
    setNavigationItems(selectedNav.items || []);
    initialNavigationItemsRef.current = cloneDeep(selectedNav.items) || null;
  }

  useEffect(() => {
    async function fetchNavigations() {
      if (!navigationId) {
        const navs = await getNavigation({ variant: 'namesOnly' });
        if (navs && navs.length > 0)
          navigate(`/plugins/webatlas/navigation/${navs[0].documentId}`);
        setLoading(false);
        return;
      }

      // If cached, use it
      if (cachedNavigations.current) {
        const selectedNav = cachedNavigations.current.find(nav => nav.documentId === navigationId);
        if (selectedNav) {
          switchNavigation(selectedNav, cachedNavigations.current);
          setLoading(false);
          return;
        }
      }

      // Otherwise, load from API
      setLoading(true);
      await loadNavigations();
      setLoading(false);
    }
    fetchNavigations();
  }, [navigationId]);

  useEffect(() => {
    if (modalType === 'NavOverview' || modalType === '') {
      setActionItem(undefined)
      setParentId(undefined)
    }
  }, [modalType]);

  useEffect(() => {
    if (!activeId || !navigationItems) return

    const item = navigationItems.find(({ id }) => id === activeId);
    setActiveItem(item);
  }, [navigationItems, activeId])

  function handleSoftAddedItem(newItem: NestedNavItem) {
    if (newItem.isNew?.parent) {
      const parentIndex = navigationItems?.findIndex(item => item.documentId === newItem.isNew?.parent);
      if (parentIndex !== undefined && parentIndex >= 0) {
        const parentDepth = navigationItems ? navigationItems[parentIndex].depth || 0 : 0;
        newItem.depth = parentDepth + 1;
        const updatedItems = navigationItems ? [
          ...navigationItems.slice(0, parentIndex + 1),
          newItem,
          ...navigationItems.slice(parentIndex + 1)
        ] : [newItem];
        setNavigationItems(updatedItems);
        return;
      }
    }
    setNavigationItems(items => items ? [...items, newItem] : [newItem])
  }

  async function saveNavigation() {
    if (!navigationItems || !selectedNavigation) return
    
    setIsSavingNavigation(true);
    
    try {
      await updateNavigationItemStructure(selectedNavigation.documentId, navigationItems);
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('notification.navigation.navigationSaved'),
          defaultMessage: 'Navigation updated successfully',
        }),
      });
    } catch (e) {
      console.error(e)
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('notification.navigation.saveNavigationFailed'),
          defaultMessage: 'Error updating navigation item',
        }),
      });
    } finally {
      await loadNavigations();
      setIsSavingNavigation(false)
    }
  }

  // React DnD Handlers --------------------------------------------------------

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

      // Update the depth of the active item
      const overIndex = navigationItems.findIndex(({ id }) => id === over.id);
      const activeIndex = navigationItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = navigationItems[activeIndex];

      navigationItems[activeIndex] = { ...activeTreeItem, depth };

      const sortedItems = arrayMove(navigationItems, activeIndex, overIndex);

      // Fix potential depth issues
      const fixedItems = [...sortedItems];
      fixedItems[0].depth = 0;
      for (let i = 1; i < fixedItems.length; i++) {
        const prev = fixedItems[i - 1].depth ?? 0;
        let curr = fixedItems[i].depth ?? 0;
        if (curr < 0) curr = 0;
        if (curr > prev + 1) curr = prev + 1;
        fixedItems[i].depth = curr;
      }
      
      setNavigationItems(fixedItems);
    }
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty('cursor', '');
  }

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

  if (loading) {
    return (
      <PageWrapper navigations={navigations} loading={loading}>
        <FullLoader />
      </PageWrapper>
    );
  }

  return (
    <ModalContext.Provider value={{modalType, setModalType}}>
      <SelectedNavigationContext.Provider value={{selectedNavigation, setSelectedNavigation}}>
        <PageWrapper navigations={navigations}>
          {selectedNavigation && <Flex gap={4} paddingBottom={6} justifyContent="flex-end">
            <Button variant="secondary" startIcon={<Plus />} onClick={() => setModalType('ItemCreate')}>
              {formatMessage({
                id: getTranslation('navigation.page.newItemButton'),
                defaultMessage: 'New Item',
              })}
            </Button>
            <Button
              onClick={() => saveNavigation()}
              loading={isSavingNavigation}
              variant="primary"
              disabled={JSON.stringify(navigationItems) === JSON.stringify(initialNavigationItemsRef.current)}
            >
              {formatMessage({
                id: getTranslation('save'),
                defaultMessage: 'Save',
              })}
            </Button>
          </Flex>}
          {selectedNavigation && navigationItems && navigationItems.length > 0 &&
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
                      key={item.documentId || index} 
                      item={item} 
                      setParentId={setParentId} 
                      setActionItem={setActionItem} 
                      setNavigationItems={setNavigationItems}
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
                          setNavigationItems={setNavigationItems}
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
            <EmptyBox msg={formatMessage({
              id: getTranslation('navigation.page.emptyNavigation'),
              defaultMessage: 'You have no navigations yet...',
            })} />
            <Button variant="primary" onClick={() => setModalType('NavCreate')}>
              {formatMessage({
                id: getTranslation('navigation.page.createNewNavigation'),
                defaultMessage: 'Create new navigation',
              })}
            </Button>
          </Center>}
          {navigations && navigationItems?.length === 0 && <Center height={400}>
            <EmptyBox msg="Your navigation is empty..." />
            <Button variant="primary" onClick={() => setModalType('ItemCreate')}>
              {formatMessage({
                id: getTranslation('navigation.page.createNewItem'),
                defaultMessage: 'Create new item',
              })}
            </Button>
          </Center>}
        </PageWrapper>
        {modalType === 'NavOverview' &&
          <NavOverview
            navigations={navigations}
            setActionItem={setActionItem}
          />
        }
        {modalType === 'NavCreate' && <NavCreate />}
        {modalType === "NavDelete"  &&
          <Delete
            variant="NavDelete"
            item={actionItem as NestedNavigation}
            onDelete={async () => {
              cachedNavigations.current = null;
              navigate('/plugins/webatlas/navigation');
            }}
          />
        }
        {modalType === 'NavEdit' &&
          <NavEdit
            item={actionItem as NestedNavigation}
            onEdit={() => {}}
          />
        }
        {modalType === 'ItemCreate' && 
          <ItemCreate
            parentId={parentId}
            onCreate={(newItem) => {
              handleSoftAddedItem(newItem)
            }}
          />
        }
        {modalType === "ItemDelete" &&
          <Delete
            variant="ItemDelete" 
            item={actionItem as NestedNavItem} 
            onDelete={(editedItem) => {
              setNavigationItems(items =>
                items?.map(item => item.id === editedItem.id ? editedItem : item)
              )
            }}
          />
        }
        {modalType === 'ItemEdit' &&
          <ItemEdit
            item={actionItem as NestedNavItem}
            onEdit={(editedItem) => {
              console.log(editedItem);
              setNavigationItems(items =>
                items?.map(item => item.id === editedItem.id ? editedItem : item)
              )
            }}
          />
        }
        {modalType === 'ExternalCreate' &&
          <ExternalItem
            variant={modalType}
            parentId={parentId}
            onCreate={(newItem) => {
              handleSoftAddedItem(newItem)
            }}
          />
        }
        {modalType === 'ExternalEdit' &&
          <ExternalItem
            variant={modalType}
            item={actionItem as NestedNavItem}
            onSave={(editedItem) => {
              setNavigationItems(items =>
                items?.map(item => item.id === editedItem.id ? editedItem : item)
              )
            }}
          />
        }
        {modalType === 'WrapperCreate' &&
          <WrapperItem
            variant={modalType}
            parentId={parentId}
            onCreate={(newItem) => {
              handleSoftAddedItem(newItem)
            }}
          />
        }
        {modalType === 'WrapperEdit' && 
          <WrapperItem 
            variant={modalType}
            item={actionItem as NestedNavItem}
            onSave={(editedItem) => {
              setNavigationItems(items =>
                items?.map(item => item.id === editedItem.id ? editedItem : item)
              )
            }}
          />
        }
      </SelectedNavigationContext.Provider>
    </ModalContext.Provider>
  );
};

export default Navigation;