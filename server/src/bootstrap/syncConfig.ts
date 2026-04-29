import type { Core } from '@strapi/strapi'
import { PluginConfig, ContentType } from '../../../types'
import { PLUGIN_ID } from '../../../utils'

export async function syncConfig(strapi: Core.Strapi, enabledContentTypes: ContentType[]) {
	const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
	const config = (await pluginStore.get({
		key: 'config',
	})) as PluginConfig

	let newConfig: PluginConfig = {
		...config,
		selectedContentTypes: [],
		navigation: {
			maxDepth: config?.navigation?.maxDepth || 1,
			...config?.navigation,
		},
		migrationVersion: config?.migrationVersion || '0',
	}

	enabledContentTypes.forEach((type: ContentType) => {
		const existingConfig = config?.selectedContentTypes?.find((ct) => ct.uid === type.uid)

		// Normalize to only include the required keys: uid, label, default
		newConfig.selectedContentTypes.push({
			uid: type.uid,
			label: type.info.displayName,
			default: existingConfig?.default || null,
		})
	})

	if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
		await pluginStore.set({ key: 'config', value: newConfig })
	}

	return newConfig
}
