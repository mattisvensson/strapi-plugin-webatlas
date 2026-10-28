import type { Core } from '@strapi/strapi'
import { enrichWebatlasData } from '../utils'

/**
 * Middleware to add a webatlas field in Content API responses
 * Uses enrichWebatlasData utility to recursively enrich entities with webatlas data
 * Works for nested relations, components, and dynamic zones
 */
export default ({ strapi }: { strapi: Core.Strapi }) => {
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

		// Extract API endpoint from URL (e.g., /api/articles -> articles)
		const urlMatch = ctx.request.url.match(/^\/api\/([^/?]+)/)
		if (!urlMatch) return

		const apiEndpoint = urlMatch[1]

		// Find the content type by matching the pluralName with the API endpoint
		const contentTypeEntry = Object.entries(strapi.contentTypes).find(
			([uid, ct]: [string, any]) => ct.info?.pluralName === apiEndpoint,
		)

		if (!contentTypeEntry) return

		const [contentTypeUid] = contentTypeEntry

		// Handle both single and paginated responses, arrays are enriched with a single query
		if (ctx.body.data) {
			ctx.body.data = await enrichWebatlasData(ctx.body.data, contentTypeUid)
		} else if (typeof ctx.body === 'object') {
			// Direct object or array response
			ctx.body = await enrichWebatlasData(ctx.body, contentTypeUid)
		}
	}
}
