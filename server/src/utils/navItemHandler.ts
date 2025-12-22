import type { NavItemSettings, NestedNavItem } from "../../../types";
import { getFullPath } from "../../../utils";
import { waRoute, waNavItem } from "../utils/pluginHelpers";
import type { UID } from '@strapi/strapi';

async function createNavItem(data: NavItemSettings): Promise<null | NestedNavItem> {
  try {
    if (!data.route || !data.navigation) return null

    const parent = data.parent ? await strapi.documents(waNavItem as UID.ContentType).findOne({
      documentId: data.parent,
      populate: ['route']
    }) : null;

    const route = data.route ? await strapi.documents(waRoute as UID.ContentType).findOne({
      documentId: data.route
    }) : null;

    let fullPath = route.slug

    if (route.internal && !route.isOverride && parent?.route.internal) fullPath = getFullPath(parent?.route?.fullPath, route.slug)

    await strapi.documents(waRoute as UID.ContentType).update({
      documentId: data.route,
      data: {
        fullPath,
      }
    });

    // TODO: Update webatlas fields in related entity
    // await strapi.documents(route.relatedContentType).update({
    //   documentId: route.relatedDocumentId,
    //   data: {
    //     webatlas_path: fullPath
    //   }
    // });

    const entity = await strapi.documents(waNavItem as UID.ContentType).create({
      data: {
        navigation: data.navigation,
        route: data.route || null,
        parent: data.parent || null,
      },
    });

    return entity as NestedNavItem;
  } catch (e) {
    console.log(e)
  }
} 

async function updateNavItem(documentId: string, data: NavItemSettings) {
  try {
    const updateData: any = {};
    if (data.navigation !== undefined && data.navigation !== null && data.navigation !== '') updateData.navigation = data.navigation;
    if (data.route !== undefined && data.route !== null && data.route !== '') updateData.route = data.route;
    if (data.parent !== undefined) updateData.parent = data.parent;
    if (data.order !== undefined && typeof data.order === 'number') updateData.order = data.order;

    return await strapi.documents(waNavItem as UID.ContentType).update({
      documentId: documentId,
      data: updateData
    });
  } catch (e) {
    console.log(e)
  }
}

async function deleteNavItem(documentId: string) {
  try {
    await strapi.documents(waNavItem as UID.ContentType).delete({
      documentId: documentId
    })
    return true
  } catch (e) {
    console.log(e)
  }
}

export { createNavItem, updateNavItem, deleteNavItem }