import type { Core } from '@strapi/strapi'
import { PLUGIN_ID, waNavigation, DEFAULT_NAVIGATION_MAX_DEPTH } from '../../../utils'

export default {
	version: '004',
	description: 'Move the global navigation max depth of the config to every navigation',
	async up(strapi: Core.Strapi) {
		const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
		const config = (await pluginStore.get({ key: 'config' })) as {
			navigation?: { maxDepth?: number }
		} | null

		// The config entry itself is removed by syncConfig, which runs after the migrations
		const maxDepth = config?.navigation?.maxDepth ?? DEFAULT_NAVIGATION_MAX_DEPTH

		const { count } = await strapi.db.query(waNavigation).updateMany({
			where: { maxDepth: { $null: true } },
			data: { maxDepth },
		})

		strapi.log.info(`[webatlas] Set the max depth ${maxDepth} for ${count} navigation(s)`)
	},
}
