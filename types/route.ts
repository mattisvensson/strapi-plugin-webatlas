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
  type: RouteType;
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
  type?: RouteType;
  parent?: string;
};

export type RouteType = 'internal' | 'external' | 'wrapper';
