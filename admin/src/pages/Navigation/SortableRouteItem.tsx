import { CSSProperties, useMemo } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { RouteItem } from './RouteItem'
import { RouteItemProps } from '../../types'

export default function SortableRouteItem({
	item,
	depth,
	setNavigationItems,
	...props
}: RouteItemProps) {
	const {
		isDragging,
		isSorting,
		setDraggableNodeRef,
		setDroppableNodeRef,
		transform,
		attributes,
		listeners,
	} = useSortable({ id: item.id })

	// Memoized, so RouteItem only re-renders when the transform or the handle actually changes
	const transformString = transform ? CSS.Translate.toString(transform) : undefined
	const style: CSSProperties = useMemo(() => ({ transform: transformString }), [transformString])
	const handleProps = useMemo(() => ({ ...attributes, ...listeners }), [attributes, listeners])

	return (
		<RouteItem
			ref={setDraggableNodeRef}
			wrapperRef={setDroppableNodeRef}
			setNavigationItems={setNavigationItems}
			style={style}
			item={item}
			disableInteraction={isSorting}
			ghost={isDragging}
			depth={depth}
			handleProps={handleProps}
			{...props}
		/>
	)
}
