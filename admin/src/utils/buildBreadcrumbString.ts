import type { NestedNavItem } from '../../../types';

/**
 * Builds a string representing the navigation hierarchy for a given target item.
 *
 * Traverses a flat, depth-annotated array of navigation items to construct a breadcrumb-like
 * hierarchy string (e.g., "Parent > Child > Target") for the specified target item.
 *
 * @param navigationItems - Flat array of NestedNavItem, ordered so that parents precede children.
 * @param targetItem - The navigation item for which to build the hierarchy string. Must have a valid depth property.
 * @returns The navigation hierarchy as a string (e.g., "Parent > Child > Target"), or null if the target is not found or input is invalid.
 */
export default function buildBreadcrumbString({
  navigationItems,
  targetItem,
  includeTarget = true,
}: {
  navigationItems?: NestedNavItem[] | null,
  targetItem: NestedNavItem,
  includeTarget?: boolean,
}): string | null {
  if (!navigationItems || !Array.isArray(navigationItems)) return null;
  if (!targetItem || typeof targetItem.depth !== 'number' || targetItem.depth <= 0) return null;

  const targetIndex = navigationItems.findIndex(
    navItem => navItem.documentId === targetItem.documentId
  );
  if (targetIndex === -1) return null;

  const parts: string[] = [];

  for (let i = targetIndex - 1; i >= 0; i--) {
    const candidate = navigationItems[i];
    parts.unshift(candidate.route.title);
    if (typeof candidate.depth === 'number' && candidate.depth === 0) break;
  }

  if (includeTarget) {
    parts.push(targetItem.route.title);
  }

  return parts.join(' > ');
}

