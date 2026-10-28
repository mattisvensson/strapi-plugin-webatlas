import type { Core } from '@strapi/strapi'
import { enrichRoutePickerFields } from '../utils'

/**
 * Middleware to enrich route-picker custom fields in Content API responses
 * Replaces documentId values with actual route paths for internal routes
 * Leaves external URLs unchanged
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
			ctx.body.data = await enrichRoutePickerFields(ctx.body.data, contentTypeUid)
		} else if (typeof ctx.body === 'object') {
			// Direct object or array response
			ctx.body = await enrichRoutePickerFields(ctx.body, contentTypeUid)
		}
	}
}
