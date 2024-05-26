import { NestedNavItem, NestedNavigation } from '../../../types';

export function isNestedNavigation(item: NestedNavItem | NestedNavigation | undefined): item is NestedNavigation {
  return (item as NestedNavigation)?.slug !== undefined;
}

export function isNestedNavItem(item: NestedNavItem | NestedNavigation | undefined): item is NestedNavItem {
  return (item as NestedNavItem)?.route !== undefined;
}
