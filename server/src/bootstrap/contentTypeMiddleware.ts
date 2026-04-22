import type { Core } from '@strapi/strapi';

export function contentTypeMiddleware(strapi: Core.Strapi) {
  strapi.documents.use(async (context, next) => {
    const pluginOptions = context.contentType?.pluginOptions;
    if (!(pluginOptions?.webatlas as { enabled?: boolean })?.enabled) {
      return next();
    }

    if (!['findOne', 'findMany'].includes(context.action)) {
      return next();
    }

    const result = await next();

    if (context.action === 'findOne') {
      if (!result || typeof result !== 'object' || Array.isArray(result)) return result;

      const entry = result as Record<string, unknown>;
      const webatlasObj = (entry.webatlas as Record<string, string>) || {};

      const newWebatlasObj = {
        path: webatlasObj.path || '',
        slug: webatlasObj.slug || '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { ...entry, webatlas: newWebatlasObj } as any;
    }

    if (context.action === 'findMany') {
      if (!Array.isArray(result)) return result;
      return result.map((entry) => {
        const webatlasObj = ((entry as Record<string, unknown>).webatlas as Record<string, string>) || {}
        const newWebatlasObj = {
          path: webatlasObj.path || '',
          slug: webatlasObj.slug || '',
        }
        return (
          { ...entry, webatlas: newWebatlasObj } as typeof entry
        )
      }
      );
    }

    return result;
  });
}
