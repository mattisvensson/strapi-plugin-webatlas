import { arrayMove } from '@dnd-kit/sortable';
import { NestedNavItem } from '../../../types';
import { UniqueIdentifier, MeasuringStrategy } from '@dnd-kit/core';

export const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export const indentationWidth = 48;

export function getProjection(
  items: NestedNavItem[] | undefined,
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  maxDepthValue: number,
) {
  if (!items) return {depth: 0, maxDepth: 0, minDepth: 0};
  const overItemIndex = items.findIndex(({id}) => id === overId);
  const activeItemIndex = items.findIndex(({id}) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem && typeof activeItem.depth === 'number' ? activeItem.depth + dragDepth : 0;
  let maxDepth = getMaxDepth({previousItem, maxDepthValue});
  let minDepth = 0
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }
  
  return {depth, maxDepth, minDepth};
}

function getMaxDepth({previousItem, maxDepthValue}: {previousItem: NestedNavItem, maxDepthValue: number}) {
  if (previousItem && typeof previousItem.depth === 'number') {
    // Subtract 1 from maxDepthValue to account for zero-based depth
    return Math.min(previousItem.depth + 1, maxDepthValue - 1);
  }

  return 0;
}

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}