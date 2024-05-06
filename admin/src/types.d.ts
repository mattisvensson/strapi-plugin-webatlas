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
  url_route: null | string;
  master?: {
    id: number;
    name: string;
    slug: string;
    visible: boolean;
    createdAt: string;
  };
  parent?: {
    id: number;
    name: string;
    slug: string;
    visible: boolean;
    createdAt: string;
  }
  createdAt: string;
  updatedAt: string;
};

export type MainModal = {
  title: string;
  body: React.ReactNode;
  startAction: React.ReactNode;
  endAction: React.ReactNode;
};