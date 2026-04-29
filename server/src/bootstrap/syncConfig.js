import { PLUGIN_ID } from '../../../utils'
export async function syncConfig(strapi, enabledContentTypes) {
	var _a
	const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
	const config = await pluginStore.get({
		key: 'config',
	})
	let newConfig = {
		...config,
		selectedContentTypes: [],
		navigation: {
			maxDepth:
				((_a = config === null || config === void 0 ? void 0 : config.navigation) === null ||
				_a === void 0
					? void 0
					: _a.maxDepth) || 1,
			...(config === null || config === void 0 ? void 0 : config.navigation),
		},
		migrationVersion:
			(config === null || config === void 0 ? void 0 : config.migrationVersion) || '0',
	}
	enabledContentTypes.forEach((type) => {
		var _a
		const existingConfig =
			(_a = config === null || config === void 0 ? void 0 : config.selectedContentTypes) === null ||
			_a === void 0
				? void 0
				: _a.find((ct) => ct.uid === type.uid)
		// Normalize to only include the required keys: uid, label, default
		newConfig.selectedContentTypes.push({
			uid: type.uid,
			label: type.info.displayName,
			default:
				(existingConfig === null || existingConfig === void 0 ? void 0 : existingConfig.default) ||
				null,
		})
	})
	if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
		await pluginStore.set({ key: 'config', value: newConfig })
	}
	return newConfig
}
