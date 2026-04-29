import type { Core } from '@strapi/strapi'

/**
 * Middleware to sanitize webatlas field in Content API responses
 * Only returns { path, slug } to external clients
 * Internal fields like isOverride, parentDocumentId stay in database
 */
export default (config, { strapi }: { strapi: Core.Strapi }) => {
	return async (ctx, next) => {
		await next()

		// Only process Content API responses (not admin)
		if (!ctx.request.url.startsWith('/api/')) {
			return
		}

		// Only process successful responses with body
		if (!ctx.body || ctx.status !== 200) {
			return
		}

		const sanitizeWebatlasField = (data: any) => {
			if (!data || typeof data !== 'object') return data

			if (data.webatlas && typeof data.webatlas === 'object') {
				data.webatlas = {
					path: data.webatlas.path || '',
					slug: data.webatlas.slug || '',
				}
			}

			return data
		}

		// Handle both single and paginated responses
		if (ctx.body.data) {
			if (Array.isArray(ctx.body.data)) {
				// Collection response
				ctx.body.data = ctx.body.data.map(sanitizeWebatlasField)
			} else {
				// Single response
				ctx.body.data = sanitizeWebatlasField(ctx.body.data)
			}
		} else if (Array.isArray(ctx.body)) {
			// Direct array response
			ctx.body = ctx.body.map(sanitizeWebatlasField)
		} else if (typeof ctx.body === 'object') {
			// Direct object response
			ctx.body = sanitizeWebatlasField(ctx.body)
		}
	}
}
