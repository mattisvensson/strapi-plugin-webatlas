import { Strapi } from "@strapi/strapi";
import { PluginConfig, ConfigContentType } from "../types";

export default async ({ strapi }: { strapi: Strapi }) => {
  if (!strapi.store) {
    throw new Error('strapi.store is undefined');
  }

  const pluginStore = strapi.store({ type: 'plugin', name: 'url-routes' });

  const config = await pluginStore.get({
    key: "config",
  }) as PluginConfig;

  if (!config?.selectedContentTypes) return

  strapi.db?.lifecycles.subscribe({
    models: config.selectedContentTypes.map((type: any) => type.uid),

    async afterCreate(event: any) {
      const ctSettings: ConfigContentType | undefined = config.selectedContentTypes.find((type: any) => type.uid === event.model.uid);

      const {
        url_alias_path,
        url_alias_isOverride,
      } = event.params.data;

      let title = '';
      if (ctSettings?.default) {
        title = event.params.data[ctSettings.default];
      }

      await strapi.db?.query('plugin::url-routes.route').create({
        data: {
          relatedContentType: event.model.uid,
          relatedId: event.result.id,
          slug: url_alias_path,
          fullPath: url_alias_path,
          uidPath: `/${event.model.uid}/${event.result.id}`,
          isOverride: url_alias_isOverride,
          internal: true,
          active: true,
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
          data.slug = url_alias_path;
          data.fullPath = url_alias_path;
        }

        await strapi.db?.query('plugin::url-routes.route').update({
          where: { id: url_alias_routeId },
          data,
        });
      }
    },

    async afterDelete(event: any) {
      await strapi.db?.query('plugin::url-routes.route').delete({
        where: {
          relatedId: event.result.id,
          relatedContentType: event.model.uid
        },
      });
    },

    async afterDeleteMany(event: any) {
      const deletedArr = event.params.where['$and']

      deletedArr.map((item: {id: {'$in': number[]}}) => {
        const ids = item.id['$in']
        ids.map(async (id: number) => {
          await strapi.db?.query('plugin::url-routes.route').delete({
            where: {
              relatedId: id,
              relatedContentType: event.model.uid
            },
          });
        })
      })
    }
  });
};