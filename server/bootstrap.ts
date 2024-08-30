import { Strapi } from "@strapi/strapi";
import { PluginConfig, ConfigContentType } from "../types";
import transformToUrl from "../utils/transformToUrl";
import duplicateCheck from "./utils/duplicateCheck";

export default async ({ strapi }: { strapi: Strapi }) => {
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
        const navitem = await strapi.db?.query('plugin::webatlas.navitem').findOne({
          where: {
            id: id
          },
          populate: ['route']
        });
  
        event.state = navitem.route.id && !navitem.route.internal ? { id: navitem.route.id } : null
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
        url_alias_path,
        url_alias_isOverride,
      } = event.params.data;

      if (!url_alias_path) return;

      let title = '';
      if (ctSettings?.default) {
        title = event.params.data[ctSettings.default];
      }

      const path = await duplicateCheck(transformToUrl(url_alias_path));

      await strapi.db?.query('plugin::webatlas.route').create({
        data: {
          relatedContentType: event.model.uid,
          relatedId: event.result.id,
          slug: path,
          fullPath: path,
          uidPath: `${event.model.apiName}/${event.result.id}`,
          isOverride: url_alias_isOverride || false,
          title: title
        },
      });
    },

    async afterUpdate(event: any) {
      const ctSettings = config.selectedContentTypes.find((type: any) => type.uid === event.model.uid);

      const {
        url_alias_path,
        url_alias_routeId,
        url_alias_isOverride
      } = event.params.data;
      
      if (url_alias_routeId) {
        const data: any = {};
        if (ctSettings?.default) data.title = event.params.data[ctSettings.default];
        if (url_alias_isOverride !== undefined) data.isOverride = url_alias_isOverride;
        if (url_alias_path) {
          const path = await duplicateCheck(transformToUrl(url_alias_path), url_alias_routeId) ;
    
          data.slug = path;
          data.fullPath = path;
        }

        await strapi.db?.query('plugin::webatlas.route').update({
          where: { id: url_alias_routeId },
          data,
        });
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

async function findAndDeleteNavItem (relatedId: number, relatedContentType: string) {

  if (!relatedId || !relatedContentType) return

  try {
    const route = await strapi.db?.query('plugin::webatlas.route').findOne({
      where: {
        relatedId: relatedId,
        relatedContentType: relatedContentType
      },
    });
  
    if (!route?.id) return
  
    const entity = await strapi.db?.query('plugin::webatlas.navitem').findOne({
      where: {
        route: {
          id: route.id
        }
      },
    });
    
    if (entity?.id) await strapi.entityService?.delete('plugin::webatlas.navitem', entity.id)
    if (route?.id) await strapi.entityService?.delete('plugin::webatlas.route', route.id)
  } catch (err) {
    console.log(err)
  }
}