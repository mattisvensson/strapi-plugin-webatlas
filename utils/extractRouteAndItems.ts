import { NestedNavItem } from "../types";
import { PLUGIN_NAME } from "../pluginId";

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

    let type

    if (!route.internal && route.wrapper) 
      type = 'wrapper'
    else if (!route.internal && !route.wrapper)
      type = 'external'
    else
      type = 'internal'

    delete route.relatedContentType
    delete route.relatedId
    delete route.createdAt
    delete route.updatedAt
    delete route.isOverride
    delete route.internal
    delete route.wrapper
    
    return { 
      __component: type === 'wrapper' ? `${PLUGIN_NAME}.wrapper` : `${PLUGIN_NAME}.route`,
      type: type,
      ...route
    };
  });
}