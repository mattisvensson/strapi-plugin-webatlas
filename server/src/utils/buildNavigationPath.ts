import type { UID } from "@strapi/strapi";
import type { NestedNavItem } from "../../../types";
import { waNavItem } from "../../../utils";
import { duplicateCheck } from "./";

export default async function buildNavigationPath({
  slug,
  routeDocumentId,
  calculatedParent,
}: {
  slug: string,
  routeDocumentId?: string,
  calculatedParent: string | null;
}) {
  let parentDocumentId: string | null = calculatedParent
  let parent: NestedNavItem | null = null

  if (parentDocumentId) {
    do {
      const navItem = await strapi.documents(waNavItem as UID.ContentType).findOne({
        documentId: parentDocumentId,
        populate: ['route', 'parent'],
      }) as NestedNavItem | null;
      parent = navItem
      parentDocumentId = navItem?.parent?.documentId || null
      console.log('New found parent: ', parent);
      if (parent?.route?.type === 'internal') break;
    } while (parentDocumentId);
  }

  if (parent?.route?.type !== 'internal')
    parent = null;

  if (slug.startsWith('/')) slug = slug.substring(1);

  const newPath = parent?.route ? `${parent.route.path}/${slug}` : `${slug}`;
  const validatedPath = await duplicateCheck(newPath, routeDocumentId);

  return validatedPath;
}
