import type { NestedNavItem, Entity, GroupedEntities } from '../../../types';

type CreateTempNavItemObjectParams = {
  parentId: string | undefined;
  entityRoute: {
    documentId: string;
  } | null;
  selectedNavigation: {
    documentId: string;
  } | null;
  navItemState: {
    active?: boolean;
    isOverride?: boolean;
    title?: string;
  };
  selectedEntity: Entity | undefined | null;
  selectedContentType: GroupedEntities | undefined | null;
  path?: {
    value: string;
    uidPath: string;
  };
  wrapper?: boolean;
  internal?: boolean;
};

export default function createTempNavItemObject({ 
  parentId, 
  entityRoute, 
  selectedNavigation, 
  navItemState, 
  selectedEntity, 
  selectedContentType,
  path,
  wrapper = false,
  internal = true,
}: CreateTempNavItemObjectParams): NestedNavItem {
    const tempNavItem: NestedNavItem = {
      id: Math.floor(Math.random() * -1000000), // Temporary negative ID
      documentId: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      depth: 0,
      status: null,
      order: 0,
      parent: parentId ? { documentId: parentId } : null,
      items: [],
      isNew: {
        route: entityRoute?.documentId ?? null,
        parent: parentId ?? null,
        navigation: selectedNavigation?.documentId ?? null, 
      },
      route: {
        active: navItemState.active || false,
        createdAt: new Date().toISOString(),
        documentId: '',
        documentIdPath: selectedEntity ? selectedEntity.documentId : '',
        fullPath: path?.value || '',
        id: 0,
        internal: internal,
        isOverride: navItemState.isOverride || false,
        relatedContentType: selectedContentType ? JSON.stringify(selectedContentType.contentType) : '',
        relatedDocumentId: selectedEntity ? selectedEntity.documentId : '',
        relatedId: selectedEntity ? selectedEntity.id : 0,
        slug: path?.value || '',
        title: navItemState.title || '',
        uidPath: path?.uidPath || '',
        updatedAt: new Date().toISOString(),
        wrapper: wrapper,
        navitem: null,
      },
    }
    return tempNavItem
  }