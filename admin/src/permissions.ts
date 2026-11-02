import { PLUGIN_ID } from '../../utils'

const pluginPermissions = {
	'cm.aside': [{ action: `plugin::${PLUGIN_ID}.cm.aside`, subject: null }],
	'cm.edit-path': [{ action: `plugin::${PLUGIN_ID}.cm.edit-path`, subject: null }],
	'navigation.read': [{ action: `plugin::${PLUGIN_ID}.navigation.read`, subject: null }],
	'navigation.create': [{ action: `plugin::${PLUGIN_ID}.navigation.create`, subject: null }],
	'navigation.update': [{ action: `plugin::${PLUGIN_ID}.navigation.update`, subject: null }],
	'navigation.delete': [{ action: `plugin::${PLUGIN_ID}.navigation.delete`, subject: null }],
	'navigation.edit-items': [
		{ action: `plugin::${PLUGIN_ID}.navigation.edit-items`, subject: null },
	],
	'page.routes': [{ action: `plugin::${PLUGIN_ID}.page.routes`, subject: null }],
	'settings.general.read': [
		{ action: `plugin::${PLUGIN_ID}.settings.general.read`, subject: null },
	],
	'settings.general.update': [
		{ action: `plugin::${PLUGIN_ID}.settings.general.update`, subject: null },
	],
	'settings.navigation.read': [
		{ action: `plugin::${PLUGIN_ID}.settings.navigation.read`, subject: null },
	],
	'settings.navigation.update': [
		{ action: `plugin::${PLUGIN_ID}.settings.navigation.update`, subject: null },
	],
}

export default pluginPermissions
