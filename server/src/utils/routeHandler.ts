import type { UID } from '@strapi/strapi';
import type { Route, RouteSettings } from "../../../types";
import { waRoute } from "../../../utils/";

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
    const entity = await strapi.documents(waRoute as UID.ContentType).update({
      documentId: documentId,
      data: {
        ...data,
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
