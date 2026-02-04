export type Route = {
  id: number;
  documentId: string,
  title: string;
  slug: string;
  path: string;
  uidPath: string;
  canonicalPath: string;
  relatedContentType: string;
  relatedId: number;
  relatedDocumentId: string,
  type: 'internal' | 'external' | 'wrapper';
  active: boolean;
  isOverride: boolean;
  navitem: {
    id: number;
  } | null;
  parent?: Route;
  children?: Route[];
  createdAt: string;
  updatedAt: string;
};

export type RouteSettings = {
  relatedContentType?: string;
  relatedId?: number;
  relatedDocumentId?: string;
  title?: string;
  path?: string;
  slug?: string;
  uidPath?: string;
  isOverride?: boolean;
  active?: boolean;
  navitem?: number;
  type?: 'internal' | 'external' | 'wrapper';
};

export type RouteHierarchyItems = {
  ancestors: string[];
  descendants: string[];
};