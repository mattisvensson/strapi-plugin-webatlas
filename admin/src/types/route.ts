import type { Route } from '../../../types/';
export type RouteSortKey = keyof Pick<Route, 'title' | 'path' | 'type'>;
