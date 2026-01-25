import type { Route, User } from './';

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
  route: string | null;
  navigation: string | null;
  parent: string | null;
  order?: number;
};

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
    documentId: string;
  } | null;
  route: Route;
  updatedAt: string;
  createdAt: string;
  status: 'published' | 'draft' | 'modified' | null;
  depth?: number;
  order: number;
  deleted?: boolean;
  update?: {
    title?: string;
    slug?: string;
    path?: string;
    isOverride?: boolean;
  }
  isNew?: {
    route: string | null;
    parent: string | null;
    navigation: string | null;
  };
}

export type StructuredNavigationVariant = 'nested' | 'flat';
