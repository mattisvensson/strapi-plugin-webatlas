import type { UID } from "@strapi/strapi";
import { waRoute } from "../../../utils";
import { Route } from "../../../types";
import { duplicateCheck } from "../utils";


export default async function cascadePathUpdates({
  validatedParentPath,
  parentRouteDocumentId,
  canonicalPath,
  isOverride,
}: {
  validatedParentPath: string,
  parentRouteDocumentId: string,
  canonicalPath: string,
  isOverride: boolean,
}) {
  try {
    const children = await strapi.db.query(waRoute).findMany({
      where: {
        parent: {
          documentId: parentRouteDocumentId
        }
      },
    }) as Route[];

    for (const child of children) {
      const newCanonicalPath = `${canonicalPath}/${child.slug}`;
      const newPath = isOverride ? `${validatedParentPath}/${child.slug}` : newCanonicalPath;

      const validatedCanonicalPath = await duplicateCheck(newCanonicalPath, child.documentId);
      const validatedPath = isOverride ? await duplicateCheck(newPath, child.documentId) : validatedCanonicalPath;

      await strapi.db.query(waRoute).updateMany({
        where: { documentId: child.documentId },
        data: {
          canonicalPath: validatedCanonicalPath,
          path: validatedPath,
        },
      });

      const existingEntry = await strapi.db.query(child.relatedContentType as UID.ContentType).findOne({
        where: { documentId: child.relatedDocumentId },
      });

      if (existingEntry) {
        await strapi.db.query(child.relatedContentType as UID.ContentType).updateMany({
          where: { documentId: child.relatedDocumentId },
          data: {
            webatlas: {
              ...existingEntry.webatlas,
              path: validatedPath,
            },
          },
        });
      }

      await cascadePathUpdates({
        validatedParentPath: validatedPath,
        parentRouteDocumentId: child.documentId,
        canonicalPath: validatedCanonicalPath,
        isOverride
      });
    }
  } catch (err) {
    strapi.log.error(err)
  }
}

