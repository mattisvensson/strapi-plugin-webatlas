import {arrayMove} from '@dnd-kit/sortable';
import { NestedNavItem } from '../../../types';
import { UniqueIdentifier } from '@dnd-kit/core';

export function getProjection(
  items: NestedNavItem[] | undefined,
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
) {
  if (!items) return {};
  
  const overItemIndex = items.findIndex(({id}) => id === overId);
  const activeItemIndex = items.findIndex(({id}) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth ? activeItem.depth + dragDepth : 0;
  const maxDepth = getMaxDepth({
    previousItem,
  });
  const minDepth = getMinDepth({nextItem});
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return {depth, maxDepth, minDepth};
}

function getMaxDepth({previousItem}: {previousItem: NestedNavItem}) {
  if (previousItem && previousItem.depth) {
    return previousItem.depth + 1;
  }

  return 0;
}

function getMinDepth({nextItem}: {nextItem: NestedNavItem}) {
  if (nextItem && nextItem.depth) {
    return nextItem.depth;
  }

  return 0;
}

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}