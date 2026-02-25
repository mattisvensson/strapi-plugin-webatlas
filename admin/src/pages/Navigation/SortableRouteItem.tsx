import { CSSProperties } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { RouteItem } from './RouteItem';
import { RouteItemProps } from '../../types';

export default function SortableRouteItem({item, depth, setNavigationItems, ...props}: RouteItemProps) {
  if (!item) return null

  const {
    isDragging,
    isSorting,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    attributes,
    listeners
  } = useSortable({id: item.id});

  const style: CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };

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
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      {...props}
    />
  );
}
