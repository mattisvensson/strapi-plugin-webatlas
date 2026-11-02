import type { Core } from '@strapi/strapi'
import { PLUGIN_ID } from '../../../utils'

export function registerPermissions(strapi: Core.Strapi) {
	// Register permission actions.
	const actions = [
		{
			section: 'plugins',
			displayName: 'Read navigations',
			uid: 'navigation.read',
			subCategory: 'Navigation',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Create navigations',
			uid: 'navigation.create',
			subCategory: 'Navigation',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Edit navigations',
			uid: 'navigation.update',
			subCategory: 'Navigation',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Delete navigations',
			uid: 'navigation.delete',
			subCategory: 'Navigation',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Edit navigation items',
			uid: 'navigation.edit-items',
			subCategory: 'Navigation',
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
			displayName: 'Read general settings',
			uid: 'settings.general.read',
			subCategory: 'Settings',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Update general settings',
			uid: 'settings.general.update',
			subCategory: 'Settings',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Read navigation settings',
			uid: 'settings.navigation.read',
			subCategory: 'Settings',
			pluginName: PLUGIN_ID,
		},
		{
			section: 'plugins',
			displayName: 'Update navigation settings',
			uid: 'settings.navigation.update',
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
		{
			section: 'plugins',
			displayName: 'Edit path (parent route and override)',
			uid: 'cm.edit-path',
			subCategory: 'Content Manager',
			pluginName: PLUGIN_ID,
		},
	]

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	;(strapi.admin.services.permission.actionProvider.registerMany as (a: any) => void)(actions)
}
