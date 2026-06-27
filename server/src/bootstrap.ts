import type { Core } from '@strapi/strapi'
import { ContentType } from '../../types'
import runMigrations from './migrations'
import {
	syncConfig,
	registerPermissions,
	documentMiddleware,
	webatlasMiddleware,
} from './bootstrap/index'
import middlewares from './middlewares'

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
	try {
		await runMigrations(strapi)

		registerPermissions(strapi)

		const enabledContentTypes: ContentType[] = Object.values(strapi.contentTypes).filter(
			(type) => type.pluginOptions?.webatlas?.enabled === true,
		)

		const config = await syncConfig(strapi, enabledContentTypes)

		if (!enabledContentTypes.length) return

		documentMiddleware(strapi, enabledContentTypes, config)
		webatlasMiddleware(strapi)

		strapi.server.use(middlewares.addWebatlasField({ strapi }))
		strapi.server.use(middlewares.enrichRoutePicker({ strapi }))
	} catch (error) {
		strapi.log.error(`Bootstrap failed. ${String(error)}`)
	}
}

export default bootstrap
