export type NavItem = {
  createdAt: string;
  createdBy: {
    id: number;
    firstname: string;
    lastname: string;
    username: string | null;
  };
  id: number;
  items: Route[];
  name: string;
  slug: string;
  updatedAt: string;
  updatedBy: {
    id: number;
    firstname: string;
    lastname: string;
    username: string | null;
  };
  url_route: string | null;
  visible: boolean;
};

export type Route = {
  id: number;
  title: string;
  path: string;
  relatedContentType: string;
  relatedId: number;
  menuAttached: boolean;
  navigation: {
    id: number;
    name: string;
    slug: string;
    visible: boolean;
    createdAt: string;
  } | null;
  parent: {
    id: number;
    name: string;
    slug: string;
    visible: boolean;
    createdAt: string;
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
  parent?: number;
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
};

export type PluginConfig = {
  selectedContentTypes: string[];
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

export type User = {
  id: number;
  firstname: string;
  lastname: string;
  username: string | null;
}
