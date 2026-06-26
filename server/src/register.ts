import { Core } from '@strapi/strapi'
import { PLUGIN_ID } from '../../utils/pluginId'

export default ({ strapi }: { strapi: Core.Strapi }) => {
	strapi.customFields.register({
		name: 'route-picker',
		plugin: PLUGIN_ID,
		type: 'string',
	})
}
