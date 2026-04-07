import type { UID } from "@strapi/strapi";
import { waRoute } from "../../../utils";

export default async function getRouteAncestors(routeId: string): Promise<string[]> {
  const ancestors = [];
  let currentId = routeId;

  while (currentId) {
    const route = await strapi.documents(waRoute as UID.ContentType).findOne({
      documentId: currentId,
      populate: ['parent']
    });
    
    if (!route?.parent) break;
    
    ancestors.push(route.parent.documentId);
    currentId = route.parent.documentId;
  }
  
  return ancestors;
}