import type { UID } from "@strapi/strapi";
import { getRouteDescendants, getExternalRouteIds } from '.';
import { waRoute } from '../../../utils';

export default async function validateRouteDependencies({
  routeId,
  newParentId
}: {
  routeId?: string | null,
  newParentId: string
}
): Promise<boolean> {
  if (!newParentId) return true

  const normalizedRouteId = routeId ?? undefined

  const parentRoute = await strapi.documents(waRoute as UID.ContentType).findOne({
    documentId: newParentId
  });

  if (!parentRoute) {
    throw new Error(`Parent route not found: ${newParentId}`);
  }

  if (parentRoute?.type === 'external') {
    throw new Error('External routes cannot have children');
  }

  if (!normalizedRouteId) return true

  const descendants = await getRouteDescendants(normalizedRouteId);
  const externalRouteIds = await getExternalRouteIds();

  if (
    normalizedRouteId === newParentId
    || descendants.includes(newParentId)
    || externalRouteIds.includes(newParentId)
  ) {
    throw new Error(`Circular dependency detected: Cannot set route ${newParentId} as parent of ${normalizedRouteId}`);
  }

  return true;
}