import type { Route } from '../../../../types'
import type { RouteSortKey } from '../../types'

export default function compareBy(
	field: RouteSortKey,
	direction: 'asc' | 'desc',
	contentTypeLabels: Map<string, string>,
) {
	if (!field) {
		return () => 0
	}
	if (field === 'contentType') {
		return (a: Route, b: Route) => {
			const aLabel = contentTypeLabels.get(a.relatedContentType)
			const bLabel = contentTypeLabels.get(b.relatedContentType)
			// Routes without a content type (external, wrapper) are always listed last
			if (!aLabel && !bLabel) return 0
			if (!aLabel) return 1
			if (!bLabel) return -1
			return direction === 'asc' ? aLabel.localeCompare(bLabel) : bLabel.localeCompare(aLabel)
		}
	}
	if (field === 'type') {
		return (a: Route, b: Route) => {
			return direction === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
		}
	}
	return (a: Route, b: Route) => {
		const aValue = a[field]
		const bValue = b[field]

		if (aValue == null && bValue == null) {
			return 0
		}
		if (aValue == null) {
			return direction === 'asc' ? 1 : -1
		}
		if (bValue == null) {
			return direction === 'asc' ? -1 : 1
		}

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
		}
		return 0
	}
}
