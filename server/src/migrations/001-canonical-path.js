import { transformToUrl, waRoute } from '../../../utils'
import { buildCanonicalPath } from '../utils'
export default {
	version: '001',
	description: 'Migrate title field to canonicalPath using transformToUrl',
	async up(strapi) {
		var _a
		strapi.log.info('[webatlas] Starting canonical path migration...')
		try {
			// Find all routes that have a title but no canonicalPath
			const routes = await ((_a = strapi.db) === null || _a === void 0
				? void 0
				: _a.query(waRoute).findMany({
						where: {
							title: {
								$notNull: true,
								$ne: '',
							},
							$or: [{ canonicalPath: { $null: true } }, { canonicalPath: '' }],
						},
						populate: ['parent'],
					}))
			if (!routes || routes.length === 0) {
				strapi.log.info('[webatlas] No routes found that need canonical path migration')
				return
			}
			strapi.log.info(`[webatlas] Found ${routes.length} routes to migrate`)
			let migratedCount = 0
			let errorCount = 0
			// Process routes in chunks to avoid overwhelming the DB
			const chunkSize = 50
			for (let i = 0; i < routes.length; i += chunkSize) {
				const chunk = routes.slice(i, i + chunkSize)
				await Promise.all(
					chunk.map(async (route) => {
						var _a, _b
						try {
							// Transform the title to URL format
							const transformedTitle = transformToUrl(route.title)
							// Build the canonical path considering parent relationships
							const parentId =
								((_a = route.parent) === null || _a === void 0 ? void 0 : _a.id) || null
							const canonicalPath = await buildCanonicalPath(transformedTitle, parentId)
							// Update the route with the new canonical path
							await ((_b = strapi.db) === null || _b === void 0
								? void 0
								: _b.query(waRoute).update({
										where: { id: route.id },
										data: { canonicalPath },
									}))
							migratedCount++
							if (migratedCount % 25 === 0) {
								strapi.log.info(`[webatlas] Migrated ${migratedCount}/${routes.length} routes`)
							}
						} catch (error) {
							strapi.log.error(`[webatlas] Failed to migrate route ${route.id}:`, error)
							errorCount++
						}
					}),
				)
			}
			strapi.log.info(
				`[webatlas] Canonical path migration completed. Migrated: ${migratedCount}, Errors: ${errorCount}`,
			)
			if (errorCount > 0) {
				strapi.log.warn(
					`[webatlas] ${errorCount} routes failed to migrate. Check logs for details.`,
				)
			}
		} catch (error) {
			strapi.log.error('[webatlas] Canonical path migration failed:', error)
			throw error
		}
	},
}
