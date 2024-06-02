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
};

export type Route = {
  id: number;
  title: string;
  path: string;
  relatedContentType: string;
  relatedId: number;
  menuAttached: boolean;
  isInternal: boolean;
  navitem: {
    id: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type RouteSettings = {
  title: string;
  path: string;
  relatedContentType: string;
  relatedId: number;
  menuAttached: boolean;
  navigation?: number[];
  parent?: number | null;
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
  default?: string;
  pattern?: string;
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
  name: string;
  slug: string;
  visible: boolean;
  items: NestedNavItem[];
  updatedAt: string;
  createdAt: string;

}

export type NestedNavItem = {
  id: number;
  items: NestedNavItem[];
  parent: {
    id: number;
  } | null;
  route: Route;
  updatedAt: string;
  createdAt: string;
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
}