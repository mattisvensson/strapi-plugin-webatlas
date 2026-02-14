import type { GroupedEntities, NestedNavItem, NestedNavigation, RouteSettings } from '../../../types';
import type { PanelPathState, PanelAction } from '../types';

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
  path: ExtendedPanelPathState,
  dispatchPath: React.Dispatch<ExtendedPanelAction>,
  debouncedCheckUrl: (url: string, routeDocumentId?: string | null | undefined) => void,
  modalType: string,
  setModalType: (value: string) => void,
  selectedNavigation: NestedNavigation | undefined,
}

export type ExtendedPanelPathState = PanelPathState & {
  initialPath: string
};

export type ExtendedPanelAction = PanelAction | { type: 'SET_INITIALPATH'; payload: string };


export type navItemStateAction = 
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SLUG'; payload: string }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_OVERRIDE'; payload: boolean }


