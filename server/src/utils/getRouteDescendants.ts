import type { UID } from "@strapi/strapi";
import { waRoute } from "../../../utils";

export default async function getRouteDescendants(routeId: string): Promise<string[]> {
  const descendants = [];
  const stack = [routeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    
    if (!currentId) continue;
    
    const children = await strapi.documents(waRoute as UID.ContentType).findMany({
      filters: { 
        parent: {
          documentId: currentId 
        }
      }
    });
    
    for (const child of children) {
      descendants.push(child.documentId);
      stack.push(child.documentId);
    }
  }
  
  return descendants;
}