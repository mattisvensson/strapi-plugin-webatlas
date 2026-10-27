import { errors } from '@strapi/utils'
import { getClientService } from '../utils/pluginHelpers'
import type { Core } from '@strapi/strapi'

const client = ({ strapi }: { strapi: Core.Strapi }) => ({
	async getEntityByPath(ctx) {
		const { slug, populate, populateDeepDepth, fields, status, breadcrumb } = ctx.query

		if (typeof slug !== 'string' || !slug) throw new errors.ValidationError('Slug is required')
		if (status !== undefined && status !== 'draft' && status !== 'published')
			throw new errors.ValidationError('Status must be "draft" or "published"')

		const entity = await getClientService().getEntityByPath(
			slug,
			populate,
			populateDeepDepth,
			fields,
			status,
			breadcrumb !== 'false',
			ctx.state.auth,
		)

		if (!entity) throw new errors.NotFoundError('Entity not found')

		return ctx.send(entity)
	},
	async getNavigation(ctx) {
		const { id, name, slug, documentId, variant } = ctx.query

		if (!id && !name && !slug && !documentId)
			throw new errors.ValidationError('Navigation id, name, slug or documentId is required')
		for (const [key, value] of Object.entries({ id, name, slug, documentId })) {
			if (value !== undefined && typeof value !== 'string')
				throw new errors.ValidationError(`Navigation ${key} must be a string`)
		}
		if (id !== undefined && !/^\d+$/.test(id))
			throw new errors.ValidationError('Navigation id must be a number')
		if (variant !== undefined && variant !== 'nested' && variant !== 'flat')
			throw new errors.ValidationError('Variant must be "nested" or "flat"')

		const navigation = await getClientService().getNavigation(id, name, slug, documentId, variant)

		if (!navigation) throw new errors.NotFoundError('Navigation not found')

		return ctx.send(navigation)
	},
})

export default client
