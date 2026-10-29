import type { NestedNavItem, NestedNavigation } from '../../../types'

export type RouteItemProps = {
	item: NestedNavItem
	// Whether the depth or the position among the previous siblings differs from the loaded state,
	// path changes are marked by clientModifications
	isMoved?: boolean
	setActionItemParent: (item: NestedNavItem | null) => void
	setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>
	setNavigationItems: React.Dispatch<React.SetStateAction<NestedNavItem[] | undefined>>
	ghost?: boolean
	depth?: number
	maxDepth: number
	style?: React.CSSProperties
	wrapperRef?(node: HTMLDivElement): void
	handleProps?: any
	disableInteraction?: boolean
	indentationWidth?: number
	navigationItems?: NestedNavItem[] | null
	hasChildren?: boolean
	collapsed?: boolean
	// Omitted to hide the collapse toggle, e.g. while searching
	onToggleCollapse?: (documentId: string) => void
}
