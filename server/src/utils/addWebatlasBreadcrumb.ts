import type { Route } from '../../../types'
import { waRoute } from '../../../utils'

type BreadcrumbEntry = Pick<Route, 'path' | 'canonicalPath' | 'slug' | 'uidPath' | 'title'>

function toBreadcrumbEntry(route: Route): BreadcrumbEntry {
	return {
		path: route.path,
		canonicalPath: route.canonicalPath,
		slug: route.slug,
		uidPath: route.uidPath,
		title: route.title,
	}
}

/**
 * Adds the ancestors of the entity's route plus the entity itself to `webatlas.breadcrumb`, ordered
 * from the root to the current page:
 *
 * [{ path: 'page-1', canonicalPath: 'page-1', slug: 'page-1', uidPath: 'page/1', title: 'Page 1' },
 *  { path: 'page-1/page-2', canonicalPath: 'page-1/page-2', slug: 'page-2', … }]
 *
 * The hierarchy comes from `canonicalPath`, which is built from the entity titles and therefore
 * unaffected by an overridden `path`.
 */
export async function addWebatlasBreadcrumb(data: any, route: Route): Promise<any> {
	if (!data?.webatlas || !route) return data

	// "page-1/page-2/page-3" -> ["page-1", "page-1/page-2"]
	const segments = route.canonicalPath?.split('/').filter(Boolean) || []
	const ancestorPaths = segments.slice(0, -1).map((_, i) => segments.slice(0, i + 1).join('/'))

	const ancestors = ancestorPaths.length
		? ((await strapi.db.query(waRoute).findMany({
				where: { canonicalPath: { $in: ancestorPaths } },
				select: ['path', 'canonicalPath', 'slug', 'uidPath', 'title'],
			})) as Route[])
		: []

	// The single query returns the ancestors unordered, so walk the prefixes to sort them by depth
	const orderedAncestors = ancestorPaths
		.map((path) => ancestors.find((ancestor) => ancestor.canonicalPath === path))
		.filter(Boolean) as Route[]

	data.webatlas.breadcrumb = [...orderedAncestors, route].map(toBreadcrumbEntry)

	return data
}
