import type {
	NestedNavItem,
	Entity,
	ConfigContentType,
	RouteType,
	ClientModifications,
} from '../../../types'
import type { ExtendedPanelPathState } from '../types'
import { transformToUrl } from '../../../utils'

type CreateTempNavItemObjectParams = {
	actionItemParentId: string | undefined
	entityRoute: {
		documentId: string
	} | null
	selectedNavigation: {
		documentId: string
	} | null
	navItemState: {
		active?: boolean
		isOverride?: boolean
		title?: string
	}
	selectedEntity: Entity | undefined | null
	selectedContentType: ConfigContentType | undefined | null
	path?: ExtendedPanelPathState
	type?: RouteType
}

// Several items can be created in the same millisecond, so the timestamp alone is not unique
let tempItemCounter = 0

export default function createTempNavItemObject({
	actionItemParentId,
	entityRoute,
	selectedNavigation,
	navItemState,
	selectedEntity,
	selectedContentType,
	path,
	type = 'internal',
}: CreateTempNavItemObjectParams): NestedNavItem {
	const clientModifications: ClientModifications = {
		type: 'create',
		route: entityRoute?.documentId ?? null,
		parent: actionItemParentId ?? null,
		navigation: selectedNavigation?.documentId ?? null,
	}

	const tempNavItem: NestedNavItem = {
		id: Math.floor(Math.random() * -1000000), // Temporary negative ID
		documentId: `temp-${Date.now()}-${tempItemCounter++}`,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		depth: 0,
		status: null,
		order: 0,
		parent: actionItemParentId ? { documentId: actionItemParentId } : null,
		items: [],
		clientModifications: { ...clientModifications },
		initialClientModifications: { ...clientModifications },
		route: {
			active: navItemState.active || false,
			createdAt: new Date().toISOString(),
			documentId: '',
			path: path?.value || '',
			canonicalPath: '',
			id: 0,
			type: type,
			isOverride: navItemState.isOverride || false,
			relatedContentType: selectedContentType ? selectedContentType.uid : '',
			relatedDocumentId: selectedEntity ? selectedEntity.documentId : '',
			relatedId: selectedEntity ? selectedEntity.id : 0,
			slug: transformToUrl(path?.slug || ''),
			title: navItemState.title || '',
			uidPath: path?.uidPath || '',
			updatedAt: new Date().toISOString(),
			navitem: null,
		},
	}
	return tempNavItem
}
