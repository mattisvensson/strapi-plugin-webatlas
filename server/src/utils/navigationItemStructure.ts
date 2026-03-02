import { UID } from "@strapi/strapi";
import type { NestedNavItem, Route, RouteSettings } from "../../../types";
import { waRoute } from "../../../utils";
import { buildNavigationPath, createExternalRoute, createNavItem, deleteNavItem, reduceDepthOfOrphanedItems, updateNavItem, updateRoute } from "./";

export type DeletionResult = {
  success: boolean;
  items: NestedNavItem[];
  errors: string[];
};

/**
 * Handles deletion of navigation items and cleanup of invalid items.
 *
 * Processes the navigation items array to:
 * - Delete items marked with `deleted` flag
 * - Reduce depth of orphaned child items after parent deletion
 * - Clean up items without routes (ideally shouldn't exist)
 *
 * @param {NestedNavItem[]} navigationItems - Array of navigation items to process
 * @returns {Promise<DeletionResult>} Result containing success status, modified items, and any errors
 *
 * @example
 * const result = await handleItemDeletion(navItems);
 * if (!result.success) {
 *   console.error('Deletion errors:', result.errors);
 * }
 * // Continue with result.items
 */
export async function handleItemDeletion(navigationItems: NestedNavItem[]): Promise<DeletionResult> {
  const errors: string[] = [];
  let items = [...navigationItems];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Handle deletions
    if (item.deleted) {
      try {
        if (item.documentId) {
          await deleteNavItem(item.documentId);
        }

        const newItems = reduceDepthOfOrphanedItems(items, item.documentId);

        if (!newItems) {
          throw new Error("Failed to reduce depth of orphaned items");
        }

        items = newItems;
        i--; // Adjust index since array was modified

      } catch (err) {
        const errorMsg = `Error deleting navigation item: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(errorMsg);
        console.error(errorMsg, err);
      }
      continue;
    }

    // Handle items without routes (cleanup)
    // This is a quick fix to remove nav items without route
    // Ideally, nav items without route shouldn't be created at all
    // TODO: Find out why nav items without route can exist
    if (!item.route && item.documentId) {
      try {
        console.warn('Navigation item without route found. Deleting it.', item);
        await deleteNavItem(item.documentId);
        items.splice(i, 1);
        i--; // Adjust index after removal
      } catch (err) {
        const errorMsg = `Error deleting navigation item without route: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(errorMsg);
        console.error(errorMsg, err);
      }
      continue;
    }
  }

  return {
    success: errors.length === 0,
    items,
    errors
  };
}

/**
 * Creates or updates a navigation item (and its related route) based on the incoming tree state.
 *
 * This function is used while persisting a navigation tree after drag/drop, edits, or item creation.
 * It supports three scenarios:
 * - **New item linked to an existing route** (`item.isNew?.route`): updates the referenced route
 *   (title/slug/path/override) and creates a nav item that points to it.
 * - **New external item** (`item.isNew` without `route`): creates a new external route and then
 *   creates a nav item pointing to it; the created nav item is stored in `newNavItemsMap` keyed
 *   by the temporary `item.documentId`.
 * - **Existing item** (`!item.isNew`): updates the nav item order/parent and optionally updates
 *   the related route when `item.update` is present.
 *
 * Note: `newNavItemsMap` is mutated and also returned for convenience.
 *
 * @param {object} params
 * @param {NestedNavItem} params.item - The navigation item being processed.
 * @param {NestedNavItem} [params.parent] - The immediate parent item from the submitted tree (used to compute paths).
 * @param {string | null} params.calculatedParent - The persisted parent documentId for the nav item, or `null` for root.
 * @param {number} params.calculatedOrder - The persisted order value for the nav item among its siblings.
 * @param {string} params.navigationId - The navigation documentId to associate new nav items with.
 * @param {Map<string, NestedNavItem>} params.newNavItemsMap - Map of temporary item IDs to created nav items.
 *
 * @returns {Promise<{ success: boolean; newNavItemsMap: Map<string, NestedNavItem>; errors: string[] }>} Update result.
 *
 * @throws {Error} When `item.isNew?.route` is set but the referenced route cannot be found.
 */
export async function handleItemUpdate({
  item,
  parent,
  calculatedParent,
  calculatedOrder,
  navigationId,
  newNavItemsMap,
}: {
  item: NestedNavItem;
  parent?: NestedNavItem;
  calculatedParent: string | null;
  calculatedOrder: number;
  navigationId: string;
  newNavItemsMap: Map<string, NestedNavItem>;
}) {
  const errors: string[] = [];

  if (item.isNew?.route) {
    const route = await strapi.documents(waRoute as UID.ContentType).findOne({
      documentId: item.isNew.route
    }) as Route

    if (!route) throw new Error("Related route not found for new navigation item")

    const routeData: RouteSettings = {}

    if (item.route.title) routeData.title = item.route.title
    if (item.route.slug) routeData.slug = item.route.slug
    if (item.route.path) routeData.path = await buildNavigationPath({
      parent: parent?.route,
      slug: item.route.slug,
      routeDocumentId: route.documentId
    })
    if (item.route.path !== route.canonicalPath) routeData.isOverride = true

    await updateRoute(route.documentId, routeData)

    await createNavItem({
      route: item.isNew.route,
      parent: calculatedParent,
      navigation: item.isNew.navigation,
      order: calculatedOrder,
    });
  }

  if (item.isNew && !item.isNew.route) {
    const newRoute = await createExternalRoute({
        title: item.route.title,
        slug: item.route.slug,
        path: item.route.path,
        type: item.route.type,
    })

    const newNavItem = await createNavItem({
      route: newRoute.documentId,
      navigation: navigationId,
      parent: calculatedParent,
      order: calculatedOrder,
    })
    if (newNavItem) newNavItemsMap.set(item.documentId, newNavItem);
  }

  if (!item.isNew) {
    await updateNavItem(item.documentId, {
      order: calculatedOrder,
      parent: calculatedParent,
    });

    if (item.update) {
      try {
        const route = await strapi.documents(waRoute as UID.ContentType).findOne({
          documentId: item.route.documentId
        }) as Route

        if (!route) throw new Error("Related route not found for new navigation item")

        const path = await buildNavigationPath({
          parent: parent?.route,
          slug: item.update.slug || item.route.slug,
          routeDocumentId: route.documentId
        })

        await updateRoute(route.documentId, {
          title: item.update.title || item.route.title,
          slug: item.update.slug || item.route.slug,
          path: path,
          isOverride: item.route.path !== route.canonicalPath,
        })
      } catch (errorMsg) {
        errors.push(errorMsg instanceof Error ? errorMsg.message : String(errorMsg));
        console.error('Error updating route ', errorMsg);
      }
    }
  }

  return {
    success: errors.length === 0,
    newNavItemsMap,
    errors
  };
}

/**
 * Computes the persisted parent id and sibling order for a single item in a *flattened* navigation tree.
 *
 * This helper is intended to be called sequentially while iterating over `navigationItems`.
 * It maintains two pieces of caller-owned state across iterations:
 * - `parentIds`: a stack of parent nav-item documentIds for the current depth
 * - `groupIndices`: the current sibling index (order) per depth
 *
 * Both arrays are mutated in place so the caller can keep state without needing to replace the arrays.
 *
 * Behavior summary:
 * - If `item.depth === 0`, the parent stack is cleared and the root order counter is incremented/reset.
 * - If the depth increases by 1 relative to the previous item, the previous item becomes the new parent
 *   and the order counter for the new depth is reset.
 * - If the depth decreases (or stays the same), the parent stack is popped to the correct depth and the
 *   order counter for the current depth is incremented.
 * - When the previous item has a temporary id (`temp-*`), it is resolved via `newNavItemsMap`.
 *
 * @param {object} params
 * @param {NestedNavItem[]} params.navigationItems - Flat list of items in display order.
 * @param {NestedNavItem} params.item - Current item being processed.
 * @param {number} params.index - Index of `item` in `navigationItems`.
 * @param {string[]} params.parentIds - Mutable stack of parent documentIds (mutated in place).
 * @param {number[]} params.groupIndices - Mutable per-depth sibling counters (mutated in place).
 * @param {Map<string, NestedNavItem>} params.newNavItemsMap - Map of temporary ids to created nav items.
 *
 * @returns {{ calculatedParent: string | null; calculatedOrder: number }}
 * The parent documentId (or `null` for root) and the computed sibling order for persistence.
 */
export function calculateParentAndOrder({
  navigationItems,
  item,
  index,
  parentIds,
  groupIndices,
  newNavItemsMap
}: {
  navigationItems: NestedNavItem[];
  item: NestedNavItem;
  index: number;
  parentIds: string[];
  groupIndices: number[];
  newNavItemsMap: Map<string, NestedNavItem>;
}) {
  // Handle depth changes and maintain parent stack
  if (item.depth === 0) {
    if (groupIndices[0] !== undefined) {
      groupIndices[0] = groupIndices[0] + 1;
    } else {
      groupIndices[0] = 0;
    }
    parentIds.length = 0;
  } else {
    const previousItem = navigationItems[index - 1];

    if (previousItem && typeof previousItem.depth === 'number') {
      if (item.depth === previousItem.depth + 1) {
        // Going deeper - previous item becomes parent
        parentIds.push(previousItem.documentId.startsWith("temp-")
          ? newNavItemsMap.get(previousItem.documentId)?.documentId || previousItem.documentId
          : previousItem.documentId);
        groupIndices[item.depth] = 0;
      } else if (item.depth <= previousItem.depth) {
        // Going back up - adjust parent stack
        const diff = previousItem.depth - item.depth;
        for (let i = 0; i < diff; i++) {
          parentIds.pop();
          groupIndices.pop();
        }
        groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
      } else {
        // Same level or other case
        groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
      }
    }
  }

  const calculatedParent = parentIds.at(-1) || null;
  const calculatedOrder = groupIndices[item.depth] || 0;

  return {
    calculatedParent,
    calculatedOrder,
  };
}
