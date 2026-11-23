import type { HealthIssue, Route } from '../../../../types'
import isBlacklistedPath from '../isBlacklistedPath'

/*
 * The health checks of the paths page. Pure functions without access to Strapi, all data is loaded
 * beforehand by the health service, so the checks can be tested with plain objects.
 */

export type HealthRoute = Pick<
	Route,
	| 'documentId'
	| 'title'
	| 'path'
	| 'canonicalPath'
	| 'uidPath'
	| 'type'
	| 'relatedContentType'
	| 'relatedDocumentId'
>

// A navigation item with its position in the tree, for the checks that depend on the navigations
export type HealthNavItem = {
	routeDocumentId: string
	navigationName: string
	depth: number
	maxDepth: number
	hasChildren: boolean
}

export type HealthData = {
	routes: HealthRoute[]
	navItems: HealthNavItem[]
	// uids of all content types that exist in Strapi
	existingContentTypes: Set<string>
	// uids of the content types selected in the plugin settings
	enabledContentTypes: Set<string>
	// documentIds of the existing entries, per content type uid
	existingDocumentIds: Map<string, Set<string>>
	// documentIds of entries that were never published (draft and publish content types only)
	draftOnlyDocumentIds: Set<string>
	routeBlacklist: string[]
}

/**
 * The frontend API finds a route by path, canonicalPath or uidPath with findFirst. A value used by
 * several routes therefore returns any one of them. External routes are skipped, their path is a
 * URL that is never requested through the API and may be linked several times on purpose.
 */
export function checkPathConflicts({ routes }: HealthData): HealthIssue[] {
	const routesByValue = new Map<string, Set<HealthRoute>>()
	for (const route of routes) {
		if (route.type === 'external') continue
		for (const value of [route.path, route.canonicalPath, route.uidPath]) {
			if (!value) continue
			const routesWithValue = routesByValue.get(value) ?? new Set()
			routesWithValue.add(route)
			routesByValue.set(value, routesWithValue)
		}
	}

	const issues: HealthIssue[] = []
	for (const [value, routesWithValue] of routesByValue) {
		if (routesWithValue.size < 2) continue
		for (const route of routesWithValue) {
			issues.push({
				check: 'pathConflict',
				severity: 'error',
				routeDocumentId: route.documentId,
				details: {
					value,
					conflictingRoutes: [...routesWithValue]
						.filter((other) => other !== route)
						.map((other) => ({ documentId: other.documentId, title: other.title })),
				},
			})
		}
	}
	return issues
}

/**
 * Internal routes whose entry or content type no longer exists, or whose content type is no longer
 * selected in the plugin settings.
 */
export function checkOrphanedRoutes({
	routes,
	existingContentTypes,
	enabledContentTypes,
	existingDocumentIds,
}: HealthData): HealthIssue[] {
	const issues: HealthIssue[] = []
	for (const route of routes) {
		if (route.type !== 'internal') continue

		const reason = !existingContentTypes.has(route.relatedContentType)
			? 'missingContentType'
			: !enabledContentTypes.has(route.relatedContentType)
				? 'disabledContentType'
				: !existingDocumentIds.get(route.relatedContentType)?.has(route.relatedDocumentId)
					? 'missingDocument'
					: null

		if (reason) {
			issues.push({
				check: 'orphanedRoute',
				severity: 'error',
				routeDocumentId: route.documentId,
				details: { reason },
			})
		}
	}
	return issues
}

/**
 * The blacklist only applies to paths created or updated after saving it, existing routes can
 * still use a blocked path. The canonical path is checked too, the frontend API resolves it as well.
 */
export function checkBlacklistedPaths({ routes, routeBlacklist }: HealthData): HealthIssue[] {
	if (routeBlacklist.length === 0) return []

	const issues: HealthIssue[] = []
	for (const route of routes) {
		if (route.type === 'external') continue

		const value = [route.path, route.canonicalPath].find((path) =>
			isBlacklistedPath(path, routeBlacklist),
		)
		if (value) {
			issues.push({
				check: 'blacklistedPath',
				severity: 'error',
				routeDocumentId: route.documentId,
				details: { value },
			})
		}
	}
	return issues
}

const VALID_EXTERNAL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

export function checkInvalidExternalUrls({ routes }: HealthData): HealthIssue[] {
	const issues: HealthIssue[] = []
	for (const route of routes) {
		if (route.type !== 'external') continue

		let isValid = false
		try {
			isValid = VALID_EXTERNAL_PROTOCOLS.includes(new URL(route.path).protocol)
		} catch {
			isValid = false
		}

		if (!isValid) {
			issues.push({
				check: 'invalidExternalUrl',
				severity: 'warning',
				routeDocumentId: route.documentId,
				details: { value: route.path },
			})
		}
	}
	return issues
}

/**
 * Navigation items of entries that were never published. The frontend API removes them from the
 * navigation, so they are missing in the navigation without a hint in the admin panel.
 */
export function checkUnpublishedInNavigation({
	routes,
	navItems,
	draftOnlyDocumentIds,
}: HealthData): HealthIssue[] {
	const navigationsByRoute = new Map<string, Set<string>>()
	for (const navItem of navItems) {
		const names = navigationsByRoute.get(navItem.routeDocumentId) ?? new Set()
		names.add(navItem.navigationName)
		navigationsByRoute.set(navItem.routeDocumentId, names)
	}

	const issues: HealthIssue[] = []
	for (const route of routes) {
		if (route.type !== 'internal' || !draftOnlyDocumentIds.has(route.relatedDocumentId)) continue

		for (const navigationName of navigationsByRoute.get(route.documentId) ?? []) {
			issues.push({
				check: 'unpublishedInNavigation',
				severity: 'warning',
				routeDocumentId: route.documentId,
				details: { navigationName },
			})
		}
	}
	return issues
}

/**
 * Items deeper than the max depth of their navigation, e.g. after the max depth was reduced in the
 * plugin settings.
 */
export function checkTooDeepItems({ navItems }: HealthData): HealthIssue[] {
	return navItems
		.filter((navItem) => navItem.depth > navItem.maxDepth)
		.map((navItem) => ({
			check: 'tooDeepItem',
			severity: 'warning',
			routeDocumentId: navItem.routeDocumentId,
			details: {
				navigationName: navItem.navigationName,
				depth: navItem.depth,
				maxDepth: navItem.maxDepth,
			},
		}))
}

export function checkNotInNavigation({ routes, navItems }: HealthData): HealthIssue[] {
	const routesInNavigation = new Set(navItems.map((navItem) => navItem.routeDocumentId))
	return routes
		.filter((route) => route.type === 'internal' && !routesInNavigation.has(route.documentId))
		.map((route) => ({
			check: 'notInNavigation',
			severity: 'info',
			routeDocumentId: route.documentId,
		}))
}

// A wrapper only groups its children, without children it shows an empty entry in the navigation
export function checkEmptyWrappers({ routes, navItems }: HealthData): HealthIssue[] {
	const wrapperRouteIds = new Set(
		routes.filter((route) => route.type === 'wrapper').map((route) => route.documentId),
	)
	return navItems
		.filter((navItem) => wrapperRouteIds.has(navItem.routeDocumentId) && !navItem.hasChildren)
		.map((navItem) => ({
			check: 'emptyWrapper',
			severity: 'info',
			routeDocumentId: navItem.routeDocumentId,
			details: { navigationName: navItem.navigationName },
		}))
}

export default function runHealthChecks(data: HealthData): HealthIssue[] {
	return [
		checkPathConflicts,
		checkOrphanedRoutes,
		checkBlacklistedPaths,
		checkInvalidExternalUrls,
		checkUnpublishedInNavigation,
		checkTooDeepItems,
		checkNotInNavigation,
		checkEmptyWrappers,
	].flatMap((check) => check(data))
}
