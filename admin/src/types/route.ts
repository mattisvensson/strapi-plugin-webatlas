import type { Route } from '../../../types/'
// contentType is sorted by the display name of relatedContentType
export type RouteSortKey = keyof Pick<Route, 'title' | 'path' | 'type'> | 'contentType'

// URL search param keys of the filters on the paths page
export type RouteFilterKey = 'contentType' | 'type' | 'deviation' | 'navigation'
