import type { Route } from '../../../types/';
export type RouteSortKey = keyof Pick<Route, 'title' | 'canonicalPath' | 'path' | 'type'>;
