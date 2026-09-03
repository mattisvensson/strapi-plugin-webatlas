import { errors } from '@strapi/utils'
import { PLUGIN_ID } from '../../../utils'
import { PluginConfig } from '../../../types'
import isBlacklistedPath from './isBlacklistedPath'
import normalizeRouteBlacklist from './normalizeRouteBlacklist'

export async function getRouteBlacklist(): Promise<string[]> {
	const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID })
	const config = (await pluginStore.get({ key: 'config' })) as PluginConfig

	return normalizeRouteBlacklist(config?.routeBlacklist)
}

export default function assertPathAllowed(path: string, routeBlacklist: string[]) {
	if (isBlacklistedPath(path, routeBlacklist)) {
		throw new errors.ApplicationError(
			`The generated path "${path}" is blocked by the route blacklist.`,
		)
	}
}
