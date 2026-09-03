import { waRoute } from '../../../utils'
import { Route } from '../../../types'
import assertPathAllowed from './assertPathAllowed'

/**
 * Checks the paths that descendants of a route will receive once the route itself moved (see
 * cascadePathUpdates), so a move can be rejected before anything is written. Mirrors how
 * cascadePathUpdates derives child paths: the canonical path always cascades, while `path` only
 * follows `validatedParentPath` when the route is an override.
 *
 * Every descendant path starts with `${validatedParentPath}/` resp. `${canonicalPath}/`, so a
 * descendant can only be blocked by a blacklist entry starting with one of those prefixes —
 * provided both parent paths already passed assertPathAllowed. If no entry does, the subtree cannot
 * be affected and the walk is skipped.
 */
export default async function assertDescendantPathsAllowed({
	validatedParentPath,
	parentRouteDocumentId,
	canonicalPath,
	isOverride,
	routeBlacklist,
}: {
	validatedParentPath: string
	parentRouteDocumentId: string
	canonicalPath: string
	isOverride: boolean
	routeBlacklist: string[]
}) {
	const prefixes = [`${validatedParentPath}/`.toLowerCase(), `${canonicalPath}/`.toLowerCase()]
	if (!routeBlacklist.some((segment) => prefixes.some((prefix) => segment.startsWith(prefix))))
		return

	const children = (await strapi.db.query(waRoute).findMany({
		where: {
			parent: {
				documentId: parentRouteDocumentId,
			},
		},
	})) as Route[]

	for (const child of children) {
		const newCanonicalPath = `${canonicalPath}/${child.slug}`
		const newPath = isOverride ? `${validatedParentPath}/${child.slug}` : newCanonicalPath

		assertPathAllowed(newCanonicalPath, routeBlacklist)
		assertPathAllowed(newPath, routeBlacklist)

		await assertDescendantPathsAllowed({
			validatedParentPath: newPath,
			parentRouteDocumentId: child.documentId,
			canonicalPath: newCanonicalPath,
			isOverride,
			routeBlacklist,
		})
	}
}
