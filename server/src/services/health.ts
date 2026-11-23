import type { HealthReport, NestedNavigation, NestedNavItem, PluginConfig } from '../../../types'
import type { UID } from '@strapi/strapi'
import { waRoute, waNavigation, DEFAULT_NAVIGATION_MAX_DEPTH } from '../../../utils'
import { buildStructuredNavigation, getDocumentStatuses, normalizeRouteBlacklist } from '../utils'
import { getAdminService } from '../utils/pluginHelpers'
import runHealthChecks, { type HealthNavItem, type HealthRoute } from '../utils/health/checks'

// Loads all data of the health checks with a few queries, the checks themselves are pure functions
async function getHealthNavItems(): Promise<HealthNavItem[]> {
	const navigations = (await strapi.documents(waNavigation).findMany({
		fields: ['name', 'maxDepth'],
		populate: {
			items: {
				fields: ['documentId', 'order'],
				populate: {
					parent: { fields: ['documentId'] },
					route: { fields: ['documentId'] },
				},
			},
		},
	})) as NestedNavigation[]

	return navigations.flatMap((navigation) => {
		const parentIds = new Set(
			(navigation.items ?? []).map((item) => item.parent?.documentId).filter(Boolean),
		)
		const { items } = buildStructuredNavigation(navigation, 'flat') as NestedNavigation

		return (items ?? [])
			.filter((item: NestedNavItem) => item.route?.documentId)
			.map((item: NestedNavItem) => ({
				routeDocumentId: item.route.documentId,
				navigationName: navigation.name,
				depth: item.depth ?? 0,
				maxDepth: navigation.maxDepth ?? DEFAULT_NAVIGATION_MAX_DEPTH,
				hasChildren: parentIds.has(item.documentId),
			}))
	})
}

// documentIds of the existing entries per content type, one query per content type
async function getExistingDocumentIds(routes: HealthRoute[], existingContentTypes: Set<string>) {
	const documentIdsByUid = new Map<string, string[]>()
	for (const route of routes) {
		if (route.type !== 'internal' || !existingContentTypes.has(route.relatedContentType)) continue
		const documentIds = documentIdsByUid.get(route.relatedContentType) ?? []
		documentIds.push(route.relatedDocumentId)
		documentIdsByUid.set(route.relatedContentType, documentIds)
	}

	const existing = new Map<string, Set<string>>()
	for (const [uid, documentIds] of documentIdsByUid) {
		// Without a status the draft versions are queried, they exist for every entry
		const entries = await strapi.documents(uid as UID.ContentType).findMany({
			filters: { documentId: { $in: documentIds } },
			fields: ['documentId'],
		})
		existing.set(uid, new Set(entries.map((entry) => entry.documentId)))
	}
	return existing
}

export default () => ({
	async getHealthReport(): Promise<HealthReport> {
		const routes = (await strapi.documents(waRoute).findMany({
			fields: [
				'title',
				'path',
				'canonicalPath',
				'uidPath',
				'type',
				'relatedContentType',
				'relatedDocumentId',
			],
		})) as unknown as HealthRoute[]

		// Merged with the default config, like in the plugin settings
		const config: PluginConfig = await getAdminService().getConfig()

		const existingContentTypes = new Set(Object.keys(strapi.contentTypes))
		const [navItems, existingDocumentIds, documentStatuses] = await Promise.all([
			getHealthNavItems(),
			getExistingDocumentIds(routes, existingContentTypes),
			getDocumentStatuses(routes),
		])

		const draftOnlyDocumentIds = new Set(
			[...documentStatuses].filter(([, status]) => status === 'draft').map(([id]) => id),
		)

		const issues = runHealthChecks({
			routes,
			navItems,
			existingContentTypes,
			enabledContentTypes: new Set(config?.selectedContentTypes?.map((type) => type.uid) ?? []),
			existingDocumentIds,
			draftOnlyDocumentIds,
			routeBlacklist: normalizeRouteBlacklist(config?.routeBlacklist),
		})

		return { issues, checkedAt: new Date().toISOString() }
	},
})
