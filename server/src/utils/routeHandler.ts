import type { UID } from '@strapi/strapi';
import type { Route, RouteSettings } from "../../../types";
import { getPath, waNavItem, waRoute } from "../../../utils/";
import { duplicateCheck } from './';

async function createExternalRoute(data: RouteSettings) {
  try {
    return await strapi.documents(waRoute as UID.ContentType).create({
      data: {
        title: data.title,
        slug: data.path,
        path: data.path,
        relatedContentType: '',
        relatedId: 0,
        relatedDocumentId: '',
        uidPath: '',
        type: data.type || 'external',
      },
    });
  } catch (e) {
    console.log(e)
  }
}

async function updateRoute(documentId: string, data: RouteSettings): Promise<Route> {
  try {
    let checkedPath = data.slug

    if (data.type !== 'external') {
      const parent = data.parent ? await strapi.documents(waNavItem as UID.ContentType).findOne({
        documentId: data.parent
      }) : null;

      const path = data.isOverride ? data.slug : getPath(parent?.path, data.slug)
      checkedPath = await duplicateCheck(path, documentId);
    }

    console.log('\n\nUpdating route with data ', { ...data, path: checkedPath })
    const entity = await strapi.documents(waRoute as UID.ContentType).update({
      documentId: documentId,
      data: {
        ...data,
        path: checkedPath,
      }
    }) as Route;

    return entity;
  } catch (e) {
    console.log(e)
  }
}

export {
  createExternalRoute,
  updateRoute,
}
