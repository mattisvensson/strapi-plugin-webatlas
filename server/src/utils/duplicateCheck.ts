import { Route } from "../../../types";
import { waRoute } from "../../../utils";
import type { UID } from '@strapi/strapi';

async function checkPathExists(path: string, targetRoutePath?: string | null): Promise<boolean> {
  const entities = await strapi.documents(waRoute as UID.ContentType).findMany({
    filters: { 
      $or: [
        { path: path },
        { slug: path },
        { uidPath: path },
        { canonicalPath: path },
      ], 
    },
  }) as Route[];

  if (targetRoutePath && entities && entities[0]?.path === targetRoutePath) 
    return false;

  return entities?.length > 0;
}

export default async function duplicateCheck(initialPath: string, targetRouteDocumentId?: string | null) {
  try {
    let uniquePath = initialPath;
    let targetRoutePath = null;
    let counter = 1;

    if (targetRouteDocumentId) {
      const route = await strapi.documents(waRoute as UID.ContentType).findOne({
        documentId: targetRouteDocumentId
      }) as Route;
      if (route) targetRoutePath = route.path;
    }
  
    // Check if the path exists
    let exists = await checkPathExists(uniquePath, targetRoutePath);

    // While the path exists, append/increment a number and check again
    while (exists) {
      uniquePath = `${initialPath}-${counter}`;
      exists = await checkPathExists(uniquePath);
      counter++;
    }
  
    // Return the unique path
    return uniquePath;
  } catch (e) {
    console.log(e)
  }
}
