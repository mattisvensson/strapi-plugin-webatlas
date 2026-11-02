import type { Core } from '@strapi/strapi'
import { PluginConfig, ContentType } from '../../../types'
import { PLUGIN_ID } from '../../../utils'

export async function syncConfig(strapi: Core.Strapi, enabledContentTypes: ContentType[]) {
	const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
	const config = (await pluginStore.get({
		key: 'config',
	})) as PluginConfig

	// The max depth is set per navigation now, migration 004 moved the former global value there
	const { navigation: _legacyNavigation, ...currentConfig } = (config ?? {}) as PluginConfig & {
		navigation?: unknown
	}

	let newConfig: PluginConfig = {
		...currentConfig,
		selectedContentTypes: [],
		migrationVersion: config?.migrationVersion || '0',
	}

	enabledContentTypes.forEach((type: ContentType) => {
		const existingConfig = config?.selectedContentTypes?.find((ct) => ct.uid === type.uid)

		// Normalize to only include the required keys: uid, label, default
		newConfig.selectedContentTypes.push({
			uid: type.uid,
			label: type.info.displayName,
			routeSourceField: existingConfig?.routeSourceField || null,
			defaultParentRoute: existingConfig?.defaultParentRoute || null,
		})
	})

	if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
		await pluginStore.set({ key: 'config', value: newConfig })
	}

	return newConfig
}
