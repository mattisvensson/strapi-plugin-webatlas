import type { Core } from '@strapi/strapi';
import { PluginConfig, ConfigContentType } from "../../types";
import transformToUrl from "../../utils/transformToUrl";
import duplicateCheck from "./utils/duplicateCheck";

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  if (!strapi.store) {
    throw new Error('strapi.store is undefined');
  }

  const pluginStore = strapi.store({ type: 'plugin', name: 'webatlas' });

  const config = await pluginStore.get({
    key: "config",
  }) as PluginConfig;

  if (!config?.selectedContentTypes) return

  strapi.db?.lifecycles.subscribe({
    models: ['plugin::webatlas.navitem'],

    async beforeDelete(event: any) {
      const id = event.params.where['id']

      if (!id) return

      try {
        const navItem = await strapi.db?.query('plugin::webatlas.navitem').findOne({
          where: {
            id: id
          },
          populate: ['route']
        });
  
        event.state = navItem.route.id && !navItem.route.internal ? { id: navItem.route.id } : null
      } catch (err) {
        console.log(err)
      }
    },

    async afterDelete(event: any) {
      const { id } = event.state

      if (!id) return

      try {
        await strapi.db?.query('plugin::webatlas.route').delete({
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
    models: config.selectedContentTypes.map((type: any) => type.uid),
    
    async beforeCreate() {
      const validContentTypes = config.selectedContentTypes.filter((type: any) => strapi.contentTypes[type.uid]);
      await pluginStore.set({ key: "config", value: {selectedContentTypes: validContentTypes} });
    },
    
    async afterCreate(event: any) {
      const ctSettings: ConfigContentType | undefined = config.selectedContentTypes.find((type: any) => type.uid === event.model.uid);

      const {
        webatlas_path, 
        webatlas_override
      } = event.params.data;

      if (!webatlas_path) return;

      const title = ctSettings?.default ? event.params.data[ctSettings.default] : '';

      const path = await duplicateCheck(transformToUrl(webatlas_path));
      await strapi.documents('plugin::webatlas.route').create({
        data: {
          relatedContentType: event.model.uid,
          relatedId: event.result.id,
          relatedDocumentId: event.result.documentId,
          slug: path,
          fullPath: path,
          uidPath: `${event.model.singularName}/${event.result.id}`,
          documentIdPath: event.result.documentId,
          isOverride: webatlas_override || false,
          title: title
        },
      });
    },

    async afterUpdate(event: any) {
      const ctSettings = config.selectedContentTypes.find((type: any) => type.uid === event.model.uid);

      const {
        webatlas_path, 
        webatlas_override,
        documentId,
      } = event.params.data;

      if (!webatlas_path) return

      const relatedRoute = await strapi.db?.query('plugin::webatlas.route').findOne({
          where: {
          relatedDocumentId: documentId
          },
        });

      const title = ctSettings?.default ? event.params.data[ctSettings.default] : ''
      const path = await duplicateCheck(transformToUrl(webatlas_path))

      const routeData: any = {
        title,
        fullPath: path,
        slug: path,
        isOverride: webatlas_override || false,
      }
      
      if (!relatedRoute) {
        await strapi.documents('plugin::webatlas.route').create({
            data: {
              relatedContentType: event.model.uid,
              relatedId: event.result.id,
            relatedDocumentId: event.result.documentId,
            uidPath: `${event.model.singularName}/${event.result.id}`,
            documentIdPath: event.result.documentId,
            ...routeData
          }
        })
      } else {
        await strapi.documents('plugin::webatlas.route').update({ 
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
    const route = await strapi.db?.query('plugin::webatlas.route').findOne({
      where: {
        relatedId: relatedId,
        relatedContentType: relatedContentType
      },
    });
  
    if (!route?.documentId) return
  
    const navItem = await strapi.db?.query('plugin::webatlas.navitem').findOne({
      where: {
        route: {
          documentId: route.documentId
        }
      },
    });
    
    await strapi.documents('plugin::webatlas.route').delete({ documentId: route.documentId })
    if (navItem?.documentId) await strapi.documents('plugin::webatlas.navitem').delete({ documentId: navItem.documentId })
    
  } catch (err) {
    console.log(err)
  }
}