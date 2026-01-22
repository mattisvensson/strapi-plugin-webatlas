import type { UID } from '@strapi/strapi';
import type { RouteSettings } from "../../../types";
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
        internal: false,
        wrapper: data.wrapper,
      },
    });
  } catch (e) {
    console.log(e)
  }
}

export { createExternalRoute }