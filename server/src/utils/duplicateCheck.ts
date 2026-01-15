import { waRoute } from "../../../utils";
import type { UID } from '@strapi/strapi';

async function checkPathExists(path: string, targetRoutePath?: string | null): Promise<boolean> {
  const entities = await strapi.documents(waRoute as UID.ContentType).findMany({
    filters: { 
      $or: [
        {
          fullPath: path,
        },
        {
          slug: path,
        },
        {
          uidPath: path,
        },
      ], 
    },
  });

  if (targetRoutePath && entities && entities[0]?.fullPath === targetRoutePath) 
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
      });
      if (route) targetRoutePath = route.fullPath;
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
