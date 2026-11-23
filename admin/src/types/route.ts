import type { Route } from '../../../types/'
export type RouteSortKey = keyof Pick<Route, 'title' | 'path' | 'type'>

// URL search param keys of the filters on the paths page
export type RouteFilterKey = 'contentType' | 'type' | 'override' | 'navigation'
