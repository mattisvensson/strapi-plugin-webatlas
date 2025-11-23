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
import { useEffect, useState } from 'react';
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
  const [initialNavigationItems, setInitialNavigationItems] = useState<NestedNavItem[]>();
  const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>();
  const [parentId, setParentId] = useState<string | undefined>();
  const { updateNavItem, getNavigation, deleteNavItem, updateRoute, createNavItem } = useApi();
  const [isSavingNavigation, setIsSavingNavigation] = useState(false);
  const [loading, setLoading] = useState(false);

  const [projected, setProjected] = useState<Projected | null>(null);
  const [activeItem, setActiveItem] = useState<NestedNavItem | undefined>();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get } = useFetchClient();

  async function loadNavigations() {
    try {
      const data = await getNavigation({ variant: 'flat' });
      const updatedNavigations = await Promise.all(
        data.map(async (nav: NestedNavigation) => {
          const updatedItems = await Promise.all(
            nav.items.map(async (item) => {
              const ct = item.route.relatedContentType;
              const id = item.route.relatedDocumentId;
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

      setNavigations(updatedNavigations);
      setSelectedNavigation(updatedNavigations[0]);
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

  useEffect(() => {
    async function fetchNavigations() {
      setLoading(true);
      await loadNavigations();
      setLoading(false);
    }
    fetchNavigations();
  }, []);

  useEffect(() => {
    if (modalType === 'NavOverview' || modalType === '') {
      setActionItem(undefined)
      setParentId(undefined)
    }
  }, [modalType]);

  useEffect(() => {
    setNavigationItems(selectedNavigation?.items || []);
  }, [selectedNavigation]);

  useEffect(() => {
    if (selectedNavigation?.items && !initialNavigationItems) {
      setInitialNavigationItems(navigationItems)
    }
  }, [navigationItems]);

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

    let error = false;

    let groupIndices: number[] = [0];
    let parentIds: string[] = [];

    for (const [index, item] of navigationItems.entries()) {
      if (item.deleted) {
        try {
          await deleteNavItem(item.documentId);
        } catch (error) {
          console.error('Error deleting navigation item ', error);
          toggleNotification({
            type: 'danger',
            message: formatMessage({
              id: getTranslation('notification.navigation.deleteFailed'),
              defaultMessage: 'Error deleting navigation item',
            }) + ' ' + item.route.title,
          });
          error = true;
        }

        loadNavigations();
        setIsSavingNavigation(false);
        return;
      }

      if (item.update && !item.isNew) {
        try {
          await updateRoute({
            title: item.update.title || item.route.title,
            slug: item.update.slug || item.route.slug,
            fullPath: item.update.fullPath || item.route.fullPath,
            isOverride: item.update.isOverride !== undefined ? item.update.isOverride : item.route.isOverride,
          }, item.route.documentId)
        } catch (error) {
          console.error('Error updating route ', error);
          toggleNotification({
            type: 'danger',
            message: formatMessage({
              id: getTranslation('notification.navigation.saveNavigationFailed'),
              defaultMessage: 'Error updating navigation item',
            }) + ' ' + item.route.title,
          });
          error = true;
        }
      }

      const previousItem = navigationItems[index - 1];

      if (typeof item.depth !== 'number') {
        setIsSavingNavigation(false);
        return
      }

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
 
      try {
        if (item.isNew) {
          await createNavItem({
            route: item.isNew.route,
            parent: item.isNew.parent,
            navigation: item.isNew.navigation,
            order: groupIndices[item.depth],
          });
        } else {
          await updateNavItem(item.documentId, {
            order: groupIndices[item.depth] || 0,
            parent: parentIds.at(-1) || null,
          });
        }
      } catch (error) {
        error = true;
        toggleNotification({
          type: 'danger',
          message: formatMessage({
            id: getTranslation('notification.navigation.saveNavigationFailed'),
            defaultMessage: 'Error updating navigation item',
          }) + ' ' + item.route.title,
        });
        console.error('Error updating navigation item ', error);
      }
    }

    setIsSavingNavigation(false);

    if (!error) {
      setInitialNavigationItems(navigationItems)
      loadNavigations();
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('notification.navigation.navigationSaved'),
          defaultMessage: 'Navigation updated successfully',
        }),
      });
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
              // TODO: update disabled condition
              // disabled={JSON.stringify(navigationItems) === JSON.stringify(initialNavigationItems)}
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
          {navigationItems?.length === 0 && <Center height={400}>
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
          <Delete variant="NavDelete"
            item={actionItem as NestedNavigation}
            onDelete={() => {}}
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
            parentDocumentId={parentId}
          />
        }
        {modalType === 'ExternalEdit' &&
          <ExternalItem
            variant={modalType}
            item={actionItem as NestedNavItem}
            onEdit={(editedItem) => {
              setNavigationItems(items =>
                items?.map(item => item.id === editedItem.id ? editedItem : item)
              )
            }}
          />
        }
        {modalType === 'WrapperCreate' &&
          <WrapperItem
            variant={modalType}
            parentDocumentId={parentId}
          />
        }
        {modalType === 'WrapperEdit' && 
          <WrapperItem 
            variant={modalType}
            item={actionItem as NestedNavItem}
            onEdit={(editedItem) => {
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