import { errors } from '@strapi/utils'
import { getClientService } from '../utils/pluginHelpers'
import type { Core } from '@strapi/strapi'

const client = ({ strapi }: { strapi: Core.Strapi }) => ({
	async getEntityByPath(ctx) {
		const { slug, populate, populateDeepDepth, fields, status, breadcrumb } = ctx.query

		if (!slug) throw new errors.ValidationError('Slug is required')

		const entity = await getClientService().getEntityByPath(
			slug,
			populate,
			populateDeepDepth,
			fields,
			status,
			breadcrumb !== 'false',
		)

		if (!entity) throw new errors.NotFoundError('Entity not found')

		return ctx.send(entity)
	},
	async getNavigation(ctx) {
		const { id, name, slug, documentId, variant } = ctx.query

		if (!id && !name && !slug && !documentId)
			throw new errors.ValidationError('Navigation id, name, slug or documentId is required')

		const navigation = await getClientService().getNavigation(id, name, slug, documentId, variant)

		if (!navigation) throw new errors.NotFoundError('Navigation not found')

		return ctx.send(navigation)
	},
})

export default client
