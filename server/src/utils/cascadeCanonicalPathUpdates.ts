import type { UID } from "@strapi/strapi";
import { waRoute } from "../../../utils";
import { Route } from "../../../types";

export default async function cascadeCanonicalPathUpdates(
  parentRouteId: string, 
  newParentCanonicalPath: string
) {
  const children = await strapi.db.query(waRoute).findMany({
    where: {
      parent: {
        documentId: parentRouteId
      }
    },
  }) as Route[] | null;

  for (const child of children) {
    const newCanonicalPath = `${newParentCanonicalPath}/${child.slug}`;
    const updateData = {
      canonicalPath: newCanonicalPath,
      // Only update path if not manually overridden
      ...(child.isOverride ? {} : { path: newCanonicalPath })
    };

    // Update the child route
    await strapi.documents(waRoute as UID.ContentType).update({
      documentId: child.documentId,
      data: updateData
    });

    // Recursively update grandchildren
    await cascadeCanonicalPathUpdates(child.documentId, newCanonicalPath);
  }
}