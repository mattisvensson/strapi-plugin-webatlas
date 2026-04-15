import type { Core, UID } from '@strapi/strapi';
import { PluginConfig, ConfigContentType, ContentType, Route } from "../../types";
import { transformToUrl, waRoute, waNavItem, PLUGIN_ID } from "../../utils";
import { duplicateCheck, buildCanonicalPath, cascadeCanonicalPathUpdates, validateRouteDependencies } from "./utils";
import runMigrations from './migrations';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {

  try {
    // Run migrations first
    await runMigrations(strapi)

    // Register permission actions.
    const actions = [
      {
        section: 'plugins',
        displayName: 'Navigation page',
        uid: 'page.navigation',
        subCategory: 'Pages',
        pluginName: PLUGIN_ID,
      },
      {
        section: 'plugins',
        displayName: 'Routes page',
        uid: 'page.routes',
        subCategory: 'Pages',
        pluginName: PLUGIN_ID,
      },
      {
        section: 'plugins',
        displayName: 'General page',
        uid: 'settings.general',
        subCategory: 'Settings',
        pluginName: PLUGIN_ID,
      },
      {
        section: 'plugins',
        displayName: 'Navigation page',
        uid: 'settings.navigation',
        subCategory: 'Settings',
        pluginName: PLUGIN_ID,
      },
      {
        section: 'plugins',
        displayName: 'Aside panel',
        uid: 'cm.aside',
        subCategory: 'Content Manager',
        pluginName: PLUGIN_ID,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (strapi.admin.services.permission.actionProvider.registerMany as (a: any) => void)(actions);
  } catch (error) {
    strapi.log.error(`Bootstrap failed. ${String(error)}`);
  }

  const contentTypes = strapi.contentTypes;
  const enabledContentTypes = Object.values(contentTypes).filter((type) =>
    type.pluginOptions?.webatlas?.enabled === true
  );

  const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID });
  const config = await pluginStore.get({
    key: "config",
  }) as PluginConfig;

  let newConfig: PluginConfig = {
    ...config,
    selectedContentTypes: [],
    navigation: {
      maxDepth: config?.navigation?.maxDepth || 1,
      ...config?.navigation
    },
    migrationVersion: config?.migrationVersion || '0'
  };

  enabledContentTypes.forEach((type: ContentType) => {
    const existingConfig = config?.selectedContentTypes?.find((ct) => ct.uid === type.uid);

    // Normalize to only include the required keys: uid, label, default
    newConfig.selectedContentTypes.push({
      uid: type.uid,
      label: type.info.displayName,
      default: existingConfig?.default || null,
    });
  })

  if(JSON.stringify(newConfig) !== JSON.stringify(config)) {
    await pluginStore.set({ key: "config", value: newConfig });
  }

  if (!enabledContentTypes.length) return

  strapi.db?.lifecycles.subscribe({
    models: [waNavItem],

    // TODO: is beforeDelete needed?
    async beforeDelete(event: any) {
      const id = event.params.where['id']

      if (!id) return

      try {
        const navItem = await strapi.db?.query(waNavItem).findOne({
          where: {
            id: id
          },
          populate: ['route']
        });

        if (!navItem || !navItem.route) return

        event.state = navItem.route.id && navItem.route.type === 'external' ? { id: navItem.route.id } : null
      } catch (err) {
        strapi.log.error(err)
      }
    },

    async afterDelete(event: any) {
      const { id } = event.state

      if (!id) return

      try {
        await strapi.db?.query(waRoute).delete({
          where: {
            id: id
          },
        });
      } catch (err) {
        strapi.log.error(err)
      }

    },
  })

  strapi.db?.lifecycles.subscribe({
    models: enabledContentTypes.map((type: ContentType) => type.uid),

    async beforeCreate(event: any) {
      // Transform path to URL format
      if (!event.params.data.webatlas_path) return;
      event.params.data.webatlas_path = transformToUrl(event.params.data.webatlas_path)
    },

    async afterCreate(event: any) {
      const ctSettings: ConfigContentType | undefined = config.selectedContentTypes.find((type: ConfigContentType) => type.uid === event.model.uid);

      const {
        webatlas_path,
        webatlas_override,
        webatlas_parent,
      } = event.params.data;

      if (!webatlas_path) return;

      const relatedRoute = await strapi.db?.query(waRoute).findOne({
        where: {
          relatedDocumentId: event.result.documentId
        },
      });

      if (relatedRoute) return;

      let parent = null
      if (webatlas_parent) {
        try {
          const isValid = await validateRouteDependencies({
            newParentId: webatlas_parent
          });
          if (isValid) parent = webatlas_parent
        } catch (err) {
          strapi.log.error(`Route dependency validation failed: ${err.message}`)
        }
      }

      const path = await duplicateCheck(transformToUrl(webatlas_path));
      const canonicalPath = await buildCanonicalPath(path, parent);
      const title = event.params.data[ctSettings?.default]?.trim() || path;

      await strapi.documents(waRoute as UID.ContentType).create({
        data: {
          relatedContentType: event.model.uid,
          relatedId: event.result.id,
          relatedDocumentId: event.result.documentId,
          slug: path,
          path: path,
          uidPath: `${event.model.singularName}/${event.result.id}`,
          isOverride: webatlas_override || false,
          title: title,
          parent: parent,
          canonicalPath: canonicalPath,
        },
      });
    },

    async afterUpdate(event: any) {
      const ctSettings = config.selectedContentTypes.find((type: ConfigContentType) => type.uid === event.model.uid);

      const {
        webatlas_path,
        webatlas_override,
        webatlas_parent,
        documentId,
      } = event.params.data;

      if (!webatlas_path) return

      const relatedRoute = await strapi.documents(waRoute as UID.ContentType).findFirst({
        filters: {
          relatedDocumentId: documentId
        },
      }) as Route | null;

      let parent: Route | null = null
      if (webatlas_parent) {
        try {
          const isValid = await validateRouteDependencies({
            routeId: relatedRoute ? relatedRoute.documentId : null,
            newParentId: webatlas_parent
          });
          if (isValid) {
            parent = await strapi.documents(waRoute as UID.ContentType).findOne({
              documentId: webatlas_parent
            }) as Route
          }
        } catch (err) {
          strapi.log.error(`Route dependency validation failed: ${err.message}`)
        }
      }

      const transformedPath = transformToUrl(webatlas_path)
      const rawPath = parent ? `${parent.path}/${transformedPath}` : transformedPath
      const path = await duplicateCheck(rawPath, relatedRoute ? relatedRoute.documentId : null);
      const canonicalPath = await buildCanonicalPath(transformedPath, parent?.documentId);
      const title = event.params.data[ctSettings?.default]?.trim() || path;

      const routeData: any = {
        title,
        path: path,
        slug: transformedPath,
        isOverride: webatlas_override || false,
        parent: parent?.documentId || null,
      }

      let routeDocumentId: string | undefined = relatedRoute?.documentId

      if (!relatedRoute) {
        const createdRoute = await strapi.documents(waRoute as UID.ContentType).create({
          data: {
            relatedContentType: event.model.uid,
            relatedId: event.result.id,
            relatedDocumentId: event.result.documentId,
            uidPath: `${event.model.singularName}/${event.result.id}`,
            canonicalPath: canonicalPath,
            ...routeData
          }
        })

        routeDocumentId = (createdRoute as any)?.documentId as string | undefined
      } else {
        await strapi.documents(waRoute as UID.ContentType).update({
          documentId: relatedRoute.documentId,
          data: {
            ...routeData,
            canonicalPath: canonicalPath
          }
        })
      }

      if (routeDocumentId) {
        await cascadeCanonicalPathUpdates(routeDocumentId, canonicalPath);
      }
    },

    async afterDelete(event: any) {
      try {
        const relatedDocumentId = event.result.documentId

        // With D&P enabled, Strapi may fire afterDelete for an individual DB row
        // (e.g. replacing the published row) while the document still exists as a draft.
        // Only proceed if no other rows for this documentId remain.
        // TODO: migrate to strapi.documents.use
        const remainingCount = await strapi.db?.query(event.model.uid).count({
          where: { documentId: relatedDocumentId },
        });
        if (remainingCount > 0) return;

        const route = await strapi.db?.query(waRoute).findOne({
          where: {
            relatedDocumentId: relatedDocumentId
          },
        });

        if (!route?.documentId) return

        const navItem = await strapi.db?.query(waNavItem).findOne({
          where: {
            route: {
              documentId: route.documentId
            }
          },
        });

        await strapi.documents(waRoute as UID.ContentType).delete({ documentId: route.documentId })
        if (navItem?.documentId) await strapi.documents(waNavItem as UID.ContentType).delete({ documentId: navItem.documentId })
      } catch (err) {
        strapi.log.error(err)
      }
    },
  });
};

export default bootstrap;
