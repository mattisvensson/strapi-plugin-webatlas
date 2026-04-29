import type { Core } from '@strapi/strapi'
import type { PluginConfig } from '../../../types'
import { PLUGIN_ID } from '../../../utils'
import migration_001_canonical_path from './001-canonical-path'
import migration_002_webatlas_json_field from './002-webatlas-json-field'

interface Migration {
	version: string
	description: string
	up: (strapi: Core.Strapi) => Promise<void>
}

const migrations: Migration[] = [migration_001_canonical_path, migration_002_webatlas_json_field]

export const runMigrations = async (strapi: Core.Strapi) => {
	const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })

	let config: Partial<PluginConfig> = await pluginStore.get({ key: 'config' })
	if (!config) {
		config = { migrationVersion: '0' }
	}

	const currentVersion = config.migrationVersion || '0'

	// Filter migrations that haven't been run yet
	const pendingMigrations = migrations.filter((migration) => migration.version > currentVersion)

	if (pendingMigrations.length === 0) {
		strapi.log.info('[webatlas] All migrations up to date')
		return
	}

	strapi.log.info(`[webatlas] Running ${pendingMigrations.length} migration(s)...`)

	for (const migration of pendingMigrations) {
		try {
			strapi.log.info(`[webatlas] Running migration ${migration.version}: ${migration.description}`)
			await migration.up(strapi)

			// Update the migration version in config
			await pluginStore.set({
				key: 'config',
				value: {
					...config,
					migrationVersion: migration.version,
				},
			})

			strapi.log.info(`[webatlas] Migration ${migration.version} completed successfully`)
		} catch (error) {
			strapi.log.error(`[webatlas] Migration ${migration.version} failed:`, error)
			throw error
		}
	}

	strapi.log.info('[webatlas] All migrations completed successfully')
}

export default runMigrations
