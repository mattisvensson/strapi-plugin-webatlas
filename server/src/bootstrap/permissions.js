import { PLUGIN_ID } from '../../../utils'
export function registerPermissions(strapi) {
	// Register permission actions.
	const actions = [
		{
			section: 'plugins',
			displayName: 'Navigation page',
			uid: 'page.navigation',
			subCategory: 'Pages',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Routes page',
			uid: 'page.routes',
			subCategory: 'Pages',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'General page',
			uid: 'settings.general',
			subCategory: 'Settings',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Navigation page',
			uid: 'settings.navigation',
			subCategory: 'Settings',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Aside panel',
			uid: 'cm.aside',
			subCategory: 'Content Manager',
			pluginName: PLUGIN_ID,
		},
	]
	strapi.admin.services.permission.actionProvider.registerMany(actions)
}
