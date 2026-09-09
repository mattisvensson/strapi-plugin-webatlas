import { errors } from '@strapi/utils'
import { getAdminService } from '../utils/pluginHelpers'

const admin = () => ({
	async updateConfig(ctx) {
		await getAdminService().updateConfig(ctx.request.body)
		return ctx.send({ status: 200 })
	},

	async getConfig(ctx) {
		return await getAdminService().getConfig()
	},

	async getRoute(ctx) {
		const { documentId } = ctx.params

		if (!documentId) throw new errors.ValidationError('Route documentId is required')

		return await getAdminService().getRoute(documentId)
	},

	async getAllRoutes(ctx) {
		return await getAdminService().getAllRoutes()
	},

	async getRelatedRoute(ctx) {
		const { documentId } = ctx.query

		if (!documentId) throw new errors.ValidationError('Route documentId is required')

		return await getAdminService().getRelatedRoute(documentId)
	},

	async getProhibitedRouteIds(ctx) {
		const { documentId } = ctx.params

		return await getAdminService().getProhibitedRouteIds(documentId)
	},

	async getNavigation(ctx) {
		const { documentId, variant } = ctx.query

		return await getAdminService().getNavigation(documentId, variant)
	},

	async createNavigation(ctx) {
		const { data } = ctx.request.body

		if (!data || !data.name) throw new errors.ValidationError('Navigation name is required')

		return await getAdminService().createNavigation(data.name, data.visible)
	},

	async updateNavigation(ctx) {
		const { documentId } = ctx.query

		if (!documentId) throw new errors.ValidationError('Navigation documentId is required')

		const { data } = ctx.request.body
		return await getAdminService().updateNavigation(documentId, data)
	},

	async updateNavigationItemStructure(ctx) {
		const { navigationId, navigationItems } = ctx.request.body

		if (!navigationId || !navigationItems)
			throw new errors.ValidationError('NavigationId and Navigation items are required')

		return await getAdminService().updateNavigationItemStructure(navigationId, navigationItems)
	},

	async deleteNavigation(ctx) {
		const { documentId } = ctx.query

		if (!documentId) throw new errors.ValidationError('Navigation documentId is required')

		return await getAdminService().deleteNavigation(documentId)
	},

	async checkUniquePath(ctx) {
		const { path, targetRouteDocumentId } = ctx.query

		if (!path) throw new errors.ValidationError('Path is required')

		const res = await getAdminService().checkUniquePath(path, targetRouteDocumentId || null)
		return ctx.send(res)
	},
})

export default admin
