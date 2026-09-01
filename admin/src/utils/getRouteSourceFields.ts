import type { ContentType } from '../../../types'

export default function getRouteSourceFields(contentType: ContentType | undefined) {
	if (!contentType?.attributes) return []

	return Object.entries(contentType.attributes).filter(
		([key, attribute]) => attribute.type === 'string' && key !== 'documentId',
	)
}
