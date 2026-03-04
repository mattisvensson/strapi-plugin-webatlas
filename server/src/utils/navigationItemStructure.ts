import type { UID } from "@strapi/strapi";
import type { NestedNavItem, Route, RouteSettings } from "../../../types";
import { waRoute } from "../../../utils";
import { buildNavigationPath, createExternalRoute, createNavItem, deleteNavItem, reduceDepthOfOrphanedItems, updateNavItem, updateRoute } from "./";

export async function handleItemDeletion(navigationItems: NestedNavItem[]) {
  const errors: string[] = [];
  let items = [...navigationItems];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Handle deletions
    if (item.clientModifications?.type === 'delete') {
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

  if (item.clientModifications?.type === 'create' && item.clientModifications?.route) {
    try {
      const route = await strapi.documents(waRoute as UID.ContentType).findOne({
        documentId: item.clientModifications.route
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
        route: item.clientModifications.route,
        navigation: item.clientModifications.navigation,
        parent: calculatedParent,
        order: calculatedOrder,
      });

      return {
        success: true,
        errors
      }
    } catch (errorMsg) {
      errors.push(errorMsg instanceof Error ? errorMsg.message : String(errorMsg));
      console.error('Error creating navigation item with existing route ', errorMsg);
    }
  }

  if (item.clientModifications?.type === 'create' && !item.clientModifications.route) {
    try {
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

      return {
        success: true,
        errors
      }
    } catch (errorMsg) {
      errors.push(errorMsg instanceof Error ? errorMsg.message : String(errorMsg));
      console.error('Error creating route for new navigation item ', errorMsg);
    }
  }

  if (item.clientModifications?.type === 'update') {
    try {
      const route = await strapi.documents(waRoute as UID.ContentType).findOne({
        documentId: item.route.documentId
      }) as Route

      if (!route) throw new Error("Related route not found for new navigation item")

      let path = item.clientModifications?.slug;
      if (item.route.type === 'internal') {
        path = await buildNavigationPath({
          parent: parent?.route,
          slug: item.clientModifications?.slug || item.route.slug,
          routeDocumentId: route.documentId
        });
      }

      await updateRoute(route.documentId, {
        title: item.clientModifications?.title || item.route.title,
        slug: item.clientModifications?.slug || item.route.slug,
        path: path,
        isOverride: item.route.path !== route.canonicalPath,
      })
    } catch (errorMsg) {
      errors.push(errorMsg instanceof Error ? errorMsg.message : String(errorMsg));
      console.error('Error updating route ', errorMsg);
    }
  }

  // Update nav item parent/order regardless of create/update since both can change position in the tree
  await updateNavItem(item.documentId, {
    parent: calculatedParent,
    order: calculatedOrder,
  });

  return {
    success: errors.length === 0,
    errors
  };
}

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
