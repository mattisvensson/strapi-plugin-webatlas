export type NavItem = {
  createdAt: string;
  createdBy: User;
  id: number;
  items: Route[];
  name: string;
  slug: string;
  updatedAt: string;
  updatedBy: User;
  visible: boolean;
};

export type NavItemSettings = {
  route: number | null;
  navigation: number | null;
  parent: number | null;
  order?: number;
};

export type Route = {
  id: number;
  documentId: string,
  title: string;
  slug: string;
  fullPath: string;
  uidPath: string;
  documentIdPath: string,
  relatedContentType: string;
  relatedId: number;
  relatedDocuentId: string,
  internal: boolean;
  active: boolean;
  isOverride: boolean;
  wrapper: boolean;
  navitem: {
    id: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type RouteSettings = {
  relatedContentType?: string;
  relatedId?: number;
  title?: string;
  fullPath?: string;
  slug?: string;
  uidPath?: string;
  isOverride?: boolean;
  internal?: boolean;
  active?: boolean;
  navitem?: number;
};

export type MainModal = {
  title: string;
  body: React.ReactNode;
  startAction: React.ReactNode;
  endAction: React.ReactNode;
};

export type ContentType = {
  uid: string;
  isDisplayed: boolean;
  apiID: string;
  kind: string;
  info: {
    name: string;
    description: string;
    singularName: string;
    pluralName: string;
    displayName: string;
  };
  attributes: {
    [key: string]: any;
  }
};

export type ConfigContentType = {
  uid: string;
  default: string;
  pattern?: string;
  apiField?: string;
}

export type PluginConfig = {
  selectedContentTypes: ConfigContentType[];
};

export type Navigation = {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  items: Route[];
  updatedAt: string;
  createdAt: string;
};

export type NavigationInput = Omit<Navigation, 'id' | 'items' | 'updatedAt' | 'createdAt' | 'slug'>;

export type Entity = {
  id: number;
  createdAt: string;
  createdBy: User;
  updatedAt: string | null;
  updatedBy: User | null;
  publishedAt: string | null;
  [key: string]: any;
}

export type GroupedEntities = {
  entities: Entity[],
  label: string,
  contentType: ConfigContentType,
}

export type User = {
  id: number;
  firstname: string;
  lastname: string;
  username: string | null;
}


export type NestedNavigation = {
  id: number;
  documentId: string,
  name: string;
  slug: string;
  visible: boolean;
  items: NestedNavItem[];
  updatedAt: string;
  createdAt: string;
}

export type NestedNavItem = {
  id: number;
  documentId: string;
  items: NestedNavItem[];
  parent: {
    id: number;
  } | null;
  route: Route;
  updatedAt: string;
  createdAt: string;
  depth?: number;
  order: number;
}

export type NavOverviewState = {
  route: NavOverviewRoute;
  navitem: NavItemSettings;
}

export type NavOverviewRoute = {
  title: string;
  slug: string;
  active: boolean;
  internal: boolean;
  isOverride: boolean;
}

export type StructuredNavigationVariant = 'nested' | 'flat';


// Modals
type ModalItem_VariantCreate = {
  parentId?: number;
}

type ModalItem_VariantEdit = {
  item: NestedNavItem;
}

type modalSharedLogic = {
  availableEntities: GroupedEntities[],
  setAvailableEntities: (value: GroupedEntities[]) => void,
  selectedEntity: Entity | null | undefined,
  setSelectedEntity: (value: Entity | null | undefined) => void,
  selectedContentType: GroupedEntities | undefined,
  setSelectedContentType: (value: GroupedEntities) => void,
  entityRoute: Route | undefined,
  setEntityRoute: (value: Route) => void,
  entities: GroupedEntities[],
  createNavItem: (NavItemSettings) => Promise<any>,
  createExternalRoute: (body: RouteSettings) => Promise<any>,
  updateRoute: (body: RouteSettings, id: number) => Promise<any>,
  getRouteByRelated: (relatedCt: string, relatedId: number, populate?: string) => Promise<any>,
  replacement: string,
  setReplacement: (value: string) => void,
  validationState: 'initial' | 'checking' | 'done',
  setValidationState: (value: 'initial' | 'checking' | 'done') => void,
  initialState: React.MutableRefObject<RouteSettings>,
  navItemState: RouteSettings,
  // dispatchItemState: React.Dispatch<Action>,
  // path: PathState,
  // dispatchPath: React.Dispatch<PathAction>,
  dispatchItemState: React.Dispatch<any>,
  path: any,
  dispatchPath: React.Dispatch<any>,
  debouncedCheckUrl: (url: string, routeDocumentId?: string | null | undefined) => void,
  modalType: string,
  setModalType: (value: string) => void,
  selectedNavigation: NestedNavigation | undefined,
}