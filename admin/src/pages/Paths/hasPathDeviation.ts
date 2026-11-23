import type { Route } from '../../../../types'

// The canonical path only differs if the navigation or an override moved the route.
// Used by the badge and the filter, so both always show the same routes
export default function hasPathDeviation(route: Route) {
	return !!route.canonicalPath && route.canonicalPath !== route.path
}
