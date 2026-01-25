import type { Entity, GroupedEntities, NestedNavItem, NestedNavigation, Route, RouteSettings } from './';

export type ModalItem_VariantCreate = {
  parentId?: string;
  onCreate: (newItem: NestedNavItem) => void;
}

export type ModalItem_VariantEdit = {
  item: NestedNavItem;
  onEdit: (editedItem: NestedNavItem) => void;
}

export type modalSharedLogic = {
  availableEntities: GroupedEntities[],
  setAvailableEntities: (value: GroupedEntities[]) => void,
  selectedEntity: Entity | null | undefined,
  setSelectedEntity: (value: Entity | null | undefined) => void,
  selectedContentType: GroupedEntities | undefined,
  setSelectedContentType: (value: GroupedEntities) => void,
  entityRoute: Route | undefined,
  setEntityRoute: (value: Route) => void,
  entities: GroupedEntities[],
  updateRoute: (body: RouteSettings, documentId: string) => Promise<any>,
  getRelatedRoute: (relatedDocumentId: string) => Promise<Route>,
  replacement: string,
  setReplacement: (value: string) => void,
  validationState: 'initial' | 'checking' | 'done',
  setValidationState: (value: 'initial' | 'checking' | 'done') => void,
  initialState: React.RefObject<RouteSettings>,
  navItemState: RouteSettings,
  dispatchItemState: React.Dispatch<any>,
  path: any,
  dispatchPath: React.Dispatch<any>,
  debouncedCheckUrl: (url: string, routeDocumentId?: string | null | undefined) => void,
  modalType: string,
  setModalType: (value: string) => void,
  selectedNavigation: NestedNavigation | undefined,
}
