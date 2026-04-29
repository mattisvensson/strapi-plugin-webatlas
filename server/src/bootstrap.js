import runMigrations from './migrations'
import {
	syncConfig,
	registerPermissions,
	documentMiddleware,
	webatlasMiddleware,
} from './bootstrap/index'
import middlewares from './middlewares'
const bootstrap = async ({ strapi }) => {
	try {
		await runMigrations(strapi)
		registerPermissions(strapi)
		const enabledContentTypes = Object.values(strapi.contentTypes).filter((type) => {
			var _a, _b
			return (
				((_b = (_a = type.pluginOptions) === null || _a === void 0 ? void 0 : _a.webatlas) ===
					null || _b === void 0
					? void 0
					: _b.enabled) === true
			)
		})
		const config = await syncConfig(strapi, enabledContentTypes)
		if (!enabledContentTypes.length) return
		documentMiddleware(strapi, enabledContentTypes, config)
		webatlasMiddleware(strapi)
		strapi.server.use(middlewares.sanitizeWebatlas({}, { strapi }))
	} catch (error) {
		strapi.log.error(`Bootstrap failed. ${String(error)}`)
	}
}
export default bootstrap
