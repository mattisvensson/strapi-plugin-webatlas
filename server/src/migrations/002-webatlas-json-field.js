export default {
	version: '002',
	description:
		'Migrate webatlas_path, webatlas_parent and webatlas_override text fields into the webatlas JSON field',
	async up(strapi) {
		var _a, _b
		const knex = strapi.db.connection
		const enabledContentTypes = Object.values(strapi.contentTypes).filter((ct) => {
			var _a, _b
			return (
				((_b = (_a = ct.pluginOptions) === null || _a === void 0 ? void 0 : _a.webatlas) === null ||
				_b === void 0
					? void 0
					: _b.enabled) === true
			)
		})
		for (const contentType of enabledContentTypes) {
			const tableName =
				(_b =
					(_a = strapi.db.metadata.get(contentType.uid)) === null || _a === void 0
						? void 0
						: _a.tableName) !== null && _b !== void 0
					? _b
					: contentType.collectionName
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
				const selectCols = ['id']
				if (hasPathCol) selectCols.push('webatlas_path')
				if (hasOverrideCol) selectCols.push('webatlas_override')
				if (hasParentCol) selectCols.push('webatlas_parent')
				const rows = await knex(tableName).select(selectCols)
				let migratedCount = 0
				for (const row of rows) {
					const path = row.webatlas_path || ''
					const isOverride = Boolean(row.webatlas_override)
					const parentDocumentId = row.webatlas_parent || null
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
			].filter(Boolean)
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
