import type { UID } from '@strapi/strapi';
import type { NavItemSettings, NestedNavItem, Route } from "../../../types";
import { waNavItem } from "../../../utils";

async function createNavItem(data: NavItemSettings): Promise<null | NestedNavItem> {
  try {
    if (!data.route || !data.navigation) return null

    const entity = await strapi.documents(waNavItem as UID.ContentType).create({
      data: {
        navigation: data.navigation,
        route: data.route || null,
        parent: data.parent || null,
        order: data.order || 0,
      },
    });

    return entity as NestedNavItem;
  } catch (e) {
    console.log(e)
  }
}

async function updateNavItem(documentId: string, data: Pick<NavItemSettings, "parent" | "order">) {
  try {
    const updateData: Partial<Pick<NavItemSettings, "parent" | "order">> = {};
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
