import { NestedNavItem } from "../types";

export default function extractRouteAndItems(items: NestedNavItem[]) {
  return items.map((item: any) => {

    const route = { ...item.route }

    if (item.depth) {
      route.depth = item.depth;
    }

    if (item.items?.length > 0) {
      const items = extractRouteAndItems(item.items);
      if (items.length > 0) route.items = items;
    }

    delete route.relatedContentType
    delete route.relatedId
    delete route.createdAt
    delete route.updatedAt
    delete route.isOverride
    
    return route;
  });
}