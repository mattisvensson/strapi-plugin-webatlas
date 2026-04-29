import type { Core, UID} from '@strapi/strapi';
import { transformToUrl, waRoute, waNavItem } from "../../../utils";
import { ContentType, PluginConfig, Route } from "../../../types";
import { duplicateCheck, buildCanonicalPath, cascadePathUpdates, validateRouteDependencies } from "../utils";

// types/strapi.ts (or a new types/webatlas.ts)
export type WebatlasDocumentData = {
  webatlas?: {
    slug?: string
    path?: string
    parentDocumentId?: string | null
    isOverride?: boolean
    [key: string]: any
  }
  [key: string]: any
}

export type DocumentResult = {
  id: number
  documentId: string
  [key: string]: any
}
export function documentMiddleware(strapi: Core.Strapi, enabledContentTypes: ContentType[], config: PluginConfig) {
  const actions = ['create', 'update', 'delete']

  strapi.documents.use(async (context, next) => {
    if (
      !enabledContentTypes.map((type: ContentType) => type.uid).includes(context.uid)
      || !actions.includes(context.action)
    ) {
      return next();
    }

    const ctSettings = config.selectedContentTypes.find((ct) => ct.uid === context.uid)

    if (context.action === 'create') {
      const data = context.params.data as WebatlasDocumentData
      const { webatlas } = data
      const { slug, parentDocumentId, isOverride } = webatlas || {}
      const transformedSlug = slug ? transformToUrl(slug) : null

      if (transformedSlug) {
        data.webatlas.slug = transformedSlug
      }

      const result = await next() as DocumentResult

      if (!transformedSlug) return result

      // Safety guard in case middleware fires more than once for the same document
      const existing = await strapi.db?.query(waRoute).findOne({
        where: { relatedDocumentId: result.documentId },
      })
      if (existing) return result

      let parent: Route | null = null
      let isValid = false
      if (parentDocumentId) {
        isValid = await validateRouteDependencies({ newParentId: parentDocumentId })
        if (isValid) {
          parent = await strapi.documents(waRoute as UID.ContentType).findOne({
            documentId: parentDocumentId
          }) as Route
        }
      }

      let rawPath = transformedSlug
      if (!isOverride) rawPath = parent ? `${parent.path}/${transformedSlug}` : transformedSlug
      const validatedPath = await duplicateCheck(rawPath)
      if (!validatedPath) throw new Error(`Failed to generate a unique path for slug: ${transformedSlug}`)

      const singularName = context.contentType.info.singularName
      const title = context.params.data[ctSettings?.default]?.trim() || transformedSlug
      const canonicalPath = await buildCanonicalPath(transformToUrl(title), isValid ? parent.documentId : null)

      await strapi.documents(waRoute as UID.ContentType).create({
        data: {
          relatedContentType: context.uid,
          relatedId: result.id,
          relatedDocumentId: result.documentId,
          slug: transformedSlug,
          path: validatedPath,
          uidPath: `${singularName}/${result.id}`,
          isOverride: isOverride || false,
          title,
          parent: isValid ? parent?.documentId : null,
          canonicalPath,
        },
      })

      await strapi.db?.query(context.uid as UID.ContentType).updateMany({
        where: { documentId: result.documentId },
        data: {
          webatlas: {
            ...webatlas,
            slug: transformedSlug,
            path: validatedPath,
            parentDocumentId: isValid ? parent?.documentId : "null",
            isOverride: isOverride || false,
          }
        },
      })

      return result
    }

    if (context.action === 'update') {
      const data = context.params.data as WebatlasDocumentData
      const { documentId } = context.params
      const { webatlas } = data
      const { slug, parentDocumentId, isOverride } = webatlas || {}

      if (!slug) return;

      const relatedRoute = await strapi.documents(waRoute as UID.ContentType).findFirst({
        filters: {
          relatedDocumentId: documentId
        },
      }) as Route | null;

      let parent: Route | null = null
      let isValid = false
      if (parentDocumentId) {
        isValid = await validateRouteDependencies({
          routeId: relatedRoute ? relatedRoute.documentId : null,
          newParentId: parentDocumentId
        });
        if (isValid) {
          parent = await strapi.documents(waRoute as UID.ContentType).findOne({
            documentId: parentDocumentId
          }) as Route
        }
      }
      const transformedSlug = transformToUrl(slug)

      let rawPath = transformedSlug
      if (!isOverride) rawPath = parent ? `${parent.path}/${transformedSlug}` : transformedSlug
      const validatedPath = await duplicateCheck(rawPath, relatedRoute?.documentId ?? null);

      data.webatlas.path = validatedPath
      data.webatlas.slug = transformedSlug

      if (relatedRoute) data.relatedRoute = relatedRoute
      if (!isValid && parentDocumentId) data.webatlas.parent = null

      const result = await next() as DocumentResult

      const title = context.params.data[ctSettings?.default]?.trim() || slug;
      const canonicalPath = isOverride ?
        relatedRoute.path
        : await buildCanonicalPath(transformToUrl(title), parent?.documentId)

      const routeData: any = {
        title,
        path: validatedPath,
        slug: slug,
        isOverride: isOverride || false,
        parent: parent?.documentId || null,
        canonicalPath: canonicalPath,
      }

      let routeDocumentId: string | undefined = relatedRoute?.documentId

      if (!relatedRoute) {
        const createdRoute = await strapi.documents(waRoute as UID.ContentType).create({
          data: {
            relatedContentType: context.uid,
            relatedId: result.id,
            relatedDocumentId: result.documentId,
            uidPath: `${context.contentType.info.singularName}/${result.id}`,
            ...routeData
          }
        })

        routeDocumentId = (createdRoute as any)?.documentId as string | undefined
      } else {
        // Use strapi.db.query().updateMany() instead of strapi.documents().update() so that
        // both draft and published route rows are updated atomically. strapi.documents().update()
        // is draft-only and its changes may not be visible to subsequent strapi.db queries
        // (e.g. inside cascadePathUpdates), causing children to read stale parent data.
        await strapi.documents(waRoute as UID.ContentType).update({
          documentId: relatedRoute.documentId,
          data: routeData
        })
      }

      if (routeDocumentId) {
        await cascadePathUpdates({
          validatedParentPath: validatedPath,
          parentRouteDocumentId: routeDocumentId,
          canonicalPath,
          isOverride,
        });
      }
    }

    if (context.action === 'delete') {
      const result = await next();

      try {
        const relatedDocumentId = context.params.documentId

        const deletedRoute = await strapi.db.query(waRoute).delete({
          where: { relatedDocumentId: relatedDocumentId },
          populate: ['navitem']
        });

        if (!deletedRoute?.documentId) return result

        const navItemDocumentIds = Array.from(deletedRoute.navitem?.map(item => item.documentId)) as string[];
        for (const navItemDocumentId of navItemDocumentIds) {
          await strapi.documents(waNavItem as UID.ContentType).delete({ documentId: navItemDocumentId })
        }
      } catch (err) {
        strapi.log.error(err)
      }

      return result
    }

    const result = await next();
    return result
  });
}
