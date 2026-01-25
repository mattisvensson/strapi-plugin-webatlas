export type Route = {
  id: number;
  documentId: string,
  title: string;
  slug: string;
  path: string;
  uidPath: string;
  relatedContentType: string;
  relatedId: number;
  relatedDocumentId: string,
  type: 'internal' | 'external' | 'wrapper';
  active: boolean;
  isOverride: boolean;
  navitem: {
    id: number;
  } | null;
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