import type { GroupedEntities, NestedNavItem, NestedNavigation, RouteSettings } from './';

export type ModalItem_VariantCreate = {
  parentNavItem: NestedNavItem | null;
  onCreate: (newItem: NestedNavItem) => void;
}

export type ModalItem_VariantEdit = {
  item: NestedNavItem;
  onEdit: (editedItem: NestedNavItem) => void;
}

export type modalSharedLogic = {
  availableEntities: GroupedEntities[],
  selectedContentType: GroupedEntities | undefined,
  setSelectedContentType: (value: GroupedEntities) => void,
  entities: GroupedEntities[],
  validationState: 'initial' | 'checking' | 'done',
  setValidationState: (value: 'initial' | 'checking' | 'done') => void,
  initialState: React.RefObject<RouteSettings>,
  navItemState: RouteSettings,
  dispatchNavItemState: React.Dispatch<any>,
  path: any,
  dispatchPath: React.Dispatch<any>,
  debouncedCheckUrl: (url: string, routeDocumentId?: string | null | undefined) => void,
  modalType: string,
  setModalType: (value: string) => void,
  selectedNavigation: NestedNavigation | undefined,
}
