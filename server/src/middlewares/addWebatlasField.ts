import type { Core } from '@strapi/strapi'
import { waRoute } from '../../../utils'

/**
 * Middleware to add a webatlas field in Content API responses
 * Fetches route data from database and adds webatlas object
 * Only returns public fields to external clients
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

		const [contentTypeUid, contentType] = contentTypeEntry

		// Helper to collect all documentIds from the response (including nested)
		// We collect from ALL content types, not just webatlas-enabled ones,
		// because nested relations might have webatlas enabled
		const collectDocumentIds = (data: any, uid: string = contentTypeUid): string[] => {
			if (!data || typeof data !== 'object') return []

			const ids: string[] = []
			if (data.documentId) {
				ids.push(data.documentId)
			}

			// Also collect from nested relations and components
			const ct = strapi.contentTypes[uid]
			if (ct?.attributes) {
				for (const [key, attr] of Object.entries(ct.attributes)) {
					const attribute = attr as any

					// Handle relations
					if (attribute.type === 'relation' && data[key]) {
						const targetUid = attribute.target
						if (Array.isArray(data[key])) {
							ids.push(...data[key].flatMap((item: any) => collectDocumentIds(item, targetUid)))
						} else {
							ids.push(...collectDocumentIds(data[key], targetUid))
						}
					}

					// Handle components
					if (attribute.type === 'component' && data[key]) {
						const componentUid = attribute.component
						if (Array.isArray(data[key])) {
							ids.push(...data[key].flatMap((item: any) => collectDocumentIds(item, componentUid)))
						} else {
							ids.push(...collectDocumentIds(data[key], componentUid))
						}
					}

					// Handle dynamic zones
					if (attribute.type === 'dynamiczone' && Array.isArray(data[key])) {
						ids.push(
							...data[key].flatMap((item: any) => {
								const componentUid = item.__component
								return collectDocumentIds(item, componentUid)
							}),
						)
					}
				}
			}

			return ids
		}

		// Collect all documentIds from response
		let documentIds: string[] = []
		if (ctx.body.data) {
			if (Array.isArray(ctx.body.data)) {
				documentIds = ctx.body.data.flatMap((item) => collectDocumentIds(item, contentTypeUid))
			} else {
				documentIds = collectDocumentIds(ctx.body.data, contentTypeUid)
			}
		} else if (Array.isArray(ctx.body)) {
			documentIds = ctx.body.flatMap((item) => collectDocumentIds(item, contentTypeUid))
		} else if (typeof ctx.body === 'object') {
			documentIds = collectDocumentIds(ctx.body, contentTypeUid)
		}

		// Fetch all routes for these documents in one query
		if (documentIds.length === 0) return

		// Remove duplicates
		const uniqueDocumentIds = [...new Set(documentIds)]

		const routes = await strapi.db?.query(waRoute).findMany({
			where: {
				relatedDocumentId: { $in: uniqueDocumentIds },
			},
			select: [
				'relatedDocumentId',
				'relatedContentType',
				'path',
				'canonicalPath',
				'slug',
				'uidPath',
			],
		})

		// Create a map for quick lookup
		const routeMap = new Map(routes?.map((route: any) => [route.relatedDocumentId, route]) || [])

		// Helper to enrich and sanitize data (recursively handles nested data)
		const enrichWebatlasField = (data: any, uid: string = contentTypeUid): any => {
			if (!data || typeof data !== 'object') return data

			// Check if webatlas is enabled for this specific content type
			const ct = strapi.contentTypes[uid]
			const isWebatlasEnabled = ct?.pluginOptions?.webatlas?.enabled === true

			// Add webatlas data if enabled and we have a route for this document
			if (isWebatlasEnabled && data.documentId && routeMap.has(data.documentId)) {
				const route = routeMap.get(data.documentId)
				data.webatlas = {
					path: route.path || '',
					canonicalPath: route.canonicalPath || '',
					slug: route.slug || '',
					uidPath: route.uidPath || '',
				}
			}

			// Recursively process relations and components (always, regardless of webatlas enabled)
			if (ct?.attributes) {
				for (const [key, attr] of Object.entries(ct.attributes)) {
					const attribute = attr as any

					// Handle relations
					if (attribute.type === 'relation' && data[key]) {
						const targetUid = attribute.target
						if (Array.isArray(data[key])) {
							data[key] = data[key].map((item: any) => enrichWebatlasField(item, targetUid))
						} else {
							data[key] = enrichWebatlasField(data[key], targetUid)
						}
					}

					// Handle components
					if (attribute.type === 'component' && data[key]) {
						const componentUid = attribute.component
						if (Array.isArray(data[key])) {
							data[key] = data[key].map((item: any) => enrichWebatlasField(item, componentUid))
						} else {
							data[key] = enrichWebatlasField(data[key], componentUid)
						}
					}

					// Handle dynamic zones
					if (attribute.type === 'dynamiczone' && Array.isArray(data[key])) {
						data[key] = data[key].map((item: any) => {
							const componentUid = item.__component
							return enrichWebatlasField(item, componentUid)
						})
					}
				}
			}

			return data
		}

		// Handle both single and paginated responses
		if (ctx.body.data) {
			if (Array.isArray(ctx.body.data)) {
				// Collection response
				ctx.body.data = ctx.body.data.map((item) => enrichWebatlasField(item, contentTypeUid))
			} else {
				// Single response
				ctx.body.data = enrichWebatlasField(ctx.body.data, contentTypeUid)
			}
		} else if (Array.isArray(ctx.body)) {
			// Direct array response
			ctx.body = ctx.body.map((item) => enrichWebatlasField(item, contentTypeUid))
		} else if (typeof ctx.body === 'object') {
			// Direct object response
			ctx.body = enrichWebatlasField(ctx.body, contentTypeUid)
		}
	}
}
