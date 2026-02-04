import type { Core, UID } from '@strapi/strapi';
import { PluginConfig, ConfigContentType, ContentType } from "../../types";
import { transformToUrl, waRoute, waNavItem, PLUGIN_ID } from "../../utils";
import { duplicateCheck } from "./utils";

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {

  try {
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
    }
  };

  enabledContentTypes.forEach((type: ContentType) => {
    const existingConfig = config?.selectedContentTypes?.find((ct) => ct.uid === type.uid);
    
    // Normalize to only include the required keys: uid, label, default, pattern
    newConfig.selectedContentTypes.push({
      uid: type.uid,
      label: type.info.displayName,
      default: existingConfig?.default || null,
      pattern: existingConfig?.pattern || null
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
        console.log(err)
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
        console.log(err)
      }

    },
  })

  strapi.db?.lifecycles.subscribe({
    models: enabledContentTypes.map((type: ContentType) => type.uid),
    
    async beforeCreate(event: any) {
      const validContentTypes = config.selectedContentTypes.filter((type: ConfigContentType) => strapi.contentTypes[type.uid]);
      await pluginStore.set({ key: "config", value: {selectedContentTypes: validContentTypes} });
      
      // Transform path to URL format
      if (!event.params.data.webatlas_path) return;    
      event.params.data.webatlas_path = transformToUrl(event.params.data.webatlas_path)
    },
    
    async afterCreate(event: any) {
      const ctSettings: ConfigContentType | undefined = config.selectedContentTypes.find((type: ConfigContentType) => type.uid === event.model.uid);

      const {
        webatlas_path, 
        webatlas_override
      } = event.params.data;

      if (!webatlas_path) return;

      const relatedRoute = await strapi.db?.query(waRoute).findOne({
        where: {
          relatedDocumentId: event.result.documentId
        },
      });

      if (relatedRoute) return;

      const title = ctSettings?.default ? event.params.data[ctSettings.default] : '';

      const path = await duplicateCheck(transformToUrl(webatlas_path));
      await strapi.documents(waRoute as UID.ContentType).create({
        data: {
          relatedContentType: event.model.uid,
          relatedId: event.result.id,
          relatedDocumentId: event.result.documentId,
          slug: path,
          path: path,
          uidPath: `${event.model.singularName}/${event.result.id}`,
          isOverride: webatlas_override || false,
          title: title
        },
      });
    },

    async afterUpdate(event: any) {
      const ctSettings = config.selectedContentTypes.find((type: ConfigContentType) => type.uid === event.model.uid);

      const {
        webatlas_path, 
        webatlas_override,
        documentId,
      } = event.params.data;

      if (!webatlas_path) return

      const relatedRoute = await strapi.db?.query(waRoute).findOne({
        where: {
          relatedDocumentId: documentId
        },
      });

      const title = ctSettings?.default ? event.params.data[ctSettings.default] : ''
      const path = await duplicateCheck(transformToUrl(webatlas_path), relatedRoute ? relatedRoute.documentId : null);

      const routeData: any = {
        title,
        path: path,
        slug: path,
        isOverride: webatlas_override || false,
      }
      
      if (!relatedRoute) {
        await strapi.documents(waRoute as UID.ContentType).create({
          data: {
            relatedContentType: event.model.uid,
            relatedId: event.result.id,
            relatedDocumentId: event.result.documentId,
            uidPath: `${event.model.singularName}/${event.result.id}`,
            ...routeData
          }
        })
      } else {
        await strapi.documents(waRoute as UID.ContentType).update({ 
          documentId: relatedRoute.documentId,
          data: {
            ...routeData
          }
        })
      }
    },

    async afterDelete(event: any) {
      try {
        await findAndDeleteNavItem(event.result.id, event.model.uid)
      } catch (err) {
        console.log(err)
      }
    },

    async afterDeleteMany(event: any) {
      const deletedArr = event.params.where['$and']

      deletedArr.map((item: {id: {'$in': number[]}}) => {
        const ids = item.id['$in']
        ids.map(async (id: number) => {
          await findAndDeleteNavItem(id, event.model.uid)
        })
      })
    }
  });
};

export default bootstrap;

async function findAndDeleteNavItem (relatedId: number, relatedContentType: string) {

  if (!relatedId || !relatedContentType) return

  try {
    const route = await strapi.db?.query(waRoute).findOne({
      where: {
        relatedId: relatedId,
        relatedContentType: relatedContentType
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
    console.log(err)
  }
}