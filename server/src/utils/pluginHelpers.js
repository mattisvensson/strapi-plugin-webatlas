import { PLUGIN_ID } from '../../../utils/pluginId'
export function getAdminService() {
	var _a
	return (_a = strapi.plugin(PLUGIN_ID)) === null || _a === void 0 ? void 0 : _a.service('admin')
}
export function getClientService() {
	var _a
	return (_a = strapi.plugin(PLUGIN_ID)) === null || _a === void 0 ? void 0 : _a.service('client')
}
