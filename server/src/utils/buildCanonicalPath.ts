import type { UID } from '@strapi/strapi'
import { waRoute } from '../../../utils'
import { Route } from '../../../types/route'

export default async function buildCanonicalPath(
	slug: string,
	parentDocumentId: string | null,
): Promise<string> {
	const parentRoute: Route | null = (await strapi.documents(waRoute).findOne({
		documentId: parentDocumentId,
	})) as Route | null

	const parentCanonicalPath = parentRoute?.canonicalPath || ''

	return `${parentCanonicalPath ? parentCanonicalPath + '/' : ''}${slug}`
}
