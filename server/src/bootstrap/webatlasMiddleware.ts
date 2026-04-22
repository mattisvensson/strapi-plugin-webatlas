import type { Core, UID} from '@strapi/strapi';
import { waRoute, waNavItem } from "../../../utils";

export function webatlasMiddleware(strapi: Core.Strapi) {
  strapi.documents.use(async (context, next) => {
    if (context.uid !== waNavItem) return next();

    if (context.action === 'delete') {
      let externalRouteDocumentId: string | null = null
      try {
        const navItem = await strapi.db?.query(waNavItem).findOne({
          where: { documentId: context.params.documentId },
          populate: ['route']
        });

        if (navItem?.route?.type === 'external') {
          externalRouteDocumentId = navItem.route.documentId
        }
      } catch (err) {
        strapi.log.error(err)
      }

      const result = await next();

      if (externalRouteDocumentId) {
        try {
          await strapi.documents(waRoute as UID.ContentType).delete({ documentId: externalRouteDocumentId });
        } catch (err) {
          strapi.log.error(err)
        }
      }

      return result
    }

    return next();
  });
}
