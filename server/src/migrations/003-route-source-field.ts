import type { Core } from '@strapi/strapi'
import type { PluginConfig } from '../../../types'
import { PLUGIN_ID } from '../../../utils'

export default {
	version: '003',
	description: 'Rename the "default" / "defaultField" content type keys to "routeSourceField"',
	async up(strapi: Core.Strapi) {
		const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
		const config = (await pluginStore.get({ key: 'config' })) as PluginConfig

		if (!config?.selectedContentTypes?.length) {
			strapi.log.info('[webatlas] No content type settings found, skipping')
			return
		}

		const selectedContentTypes = config.selectedContentTypes.map((ct: any) => {
			const { default: legacyDefault, defaultField, ...rest } = ct
			return {
				...rest,
				routeSourceField: ct.routeSourceField || defaultField || legacyDefault || null,
			}
		})

		await pluginStore.set({ key: 'config', value: { ...config, selectedContentTypes } })

		strapi.log.info(
			`[webatlas] Normalized routeSourceField for ${selectedContentTypes.length} content type(s)`,
		)
	},
}
