import type { UID } from "@strapi/strapi";
import { getRouteDescendants, getExternalRouteIds } from '.';
import { waRoute } from '../../../utils';

export default async function validateRouteDependencies(routeId: string, newParentId: string): Promise<boolean> {
  if (!newParentId) return true

  const parentRoute = await strapi.documents(waRoute as UID.ContentType).findOne({
    documentId: newParentId
  });

  if (parentRoute?.type === 'external') {
    throw new Error('External routes cannot have children');
  }

  const descendants = await getRouteDescendants(routeId);
  const externalRouteIds = await getExternalRouteIds();

  if (
    routeId === newParentId
    || descendants.includes(newParentId)
    || externalRouteIds.includes(newParentId)
  ) {
    throw new Error(`Circular dependency detected: Cannot set route ${newParentId} as parent of ${routeId}`);
  }

  return true;
}