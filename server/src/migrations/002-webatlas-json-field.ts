import type { Core } from '@strapi/strapi'
import type { ContentType } from '../../../types'

export default {
	version: '002',
	description:
		'Migrate webatlas_path, webatlas_parent and webatlas_override text fields into the webatlas JSON field',
	async up(strapi: Core.Strapi) {
		const knex = strapi.db.connection

		const enabledContentTypes = (Object.values(strapi.contentTypes) as ContentType[]).filter(
			(ct) => ct.pluginOptions?.webatlas?.enabled === true,
		)

		for (const contentType of enabledContentTypes) {
			const tableName: string =
				(strapi.db.metadata.get(contentType.uid) as any)?.tableName ??
				(contentType as any).collectionName
			strapi.log.info(`[webatlas] Processing table: ${tableName} (${contentType.uid})`)

			// Check which old columns still exist
			const [hasPathCol, hasOverrideCol, hasParentCol, hasWebatlasCol] = await Promise.all([
				knex.schema.hasColumn(tableName, 'webatlas_path'),
				knex.schema.hasColumn(tableName, 'webatlas_override'),
				knex.schema.hasColumn(tableName, 'webatlas_parent'),
				knex.schema.hasColumn(tableName, 'webatlas'),
			])

			const hasAnyOldCol = hasPathCol || hasOverrideCol || hasParentCol

			if (!hasAnyOldCol) {
				strapi.log.info(`[webatlas] No old fields found in ${tableName}, skipping data migration`)
			} else if (!hasWebatlasCol) {
				strapi.log.warn(
					`[webatlas] New "webatlas" column not found in ${tableName} — schema may not have synced yet. Skipping data migration, old columns will still be dropped.`,
				)
			} else {
				// Build select list from only the columns that exist
				const selectCols: string[] = ['id']
				if (hasPathCol) selectCols.push('webatlas_path')
				if (hasOverrideCol) selectCols.push('webatlas_override')
				if (hasParentCol) selectCols.push('webatlas_parent')

				const rows = await knex(tableName).select(selectCols)
				let migratedCount = 0

				for (const row of rows) {
					const path: string = row.webatlas_path || ''
					const isOverride: boolean = Boolean(row.webatlas_override)
					const parentDocumentId: string | null = row.webatlas_parent || null

					if (!path && !isOverride && !parentDocumentId) continue

					// Derive slug from the last segment of the path
					const slug = path ? path.split('/').pop() || '' : ''

					await knex(tableName)
						.where({ id: row.id })
						.update({
							webatlas: JSON.stringify({
								path,
								slug,
								isOverride,
								parentDocumentId,
							}),
						})

					migratedCount++
				}

				strapi.log.info(
					`[webatlas] Migrated ${migratedCount} / ${rows.length} rows in ${tableName}`,
				)
			}

			// Drop old columns regardless of whether data was migrated
			const colsToDrop = [
				hasPathCol && 'webatlas_path',
				hasOverrideCol && 'webatlas_override',
				hasParentCol && 'webatlas_parent',
			].filter(Boolean) as string[]

			if (colsToDrop.length > 0) {
				await knex.schema.table(tableName, (table) => {
					colsToDrop.forEach((col) => table.dropColumn(col))
				})
				strapi.log.info(`[webatlas] Dropped columns [${colsToDrop.join(', ')}] from ${tableName}`)
			}
		}

		strapi.log.info('[webatlas] webatlas JSON field migration completed')
	},
}
