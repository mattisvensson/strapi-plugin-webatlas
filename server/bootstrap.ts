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
          path: url_alias_path,
          isOverride: url_alias_isOverride,
          title: title
        },
      });
    },

    async afterUpdate(event: any) {
      const ctSettings = config.selectedContentTypes.find((type: any) => type.uid === event.model.uid);
      
      const { 
        url_alias_path, 
        url_alias_routeId, 
        url_alias_relatedContentType, 
        url_alias_relatedId,
        url_alias_isOverride
      } = event.params.data;

      let title = '';
      if (ctSettings?.default) {
        title = event.params.data[ctSettings.default];
      }

      if (url_alias_routeId) {
        const data: any = {};
        if (title) data.title = title;
        if (url_alias_path) data.path = url_alias_path;
        if (url_alias_isOverride !== undefined) data.isOverride = url_alias_isOverride;
        if (url_alias_relatedContentType) data.relatedContentType = url_alias_relatedContentType;
        if (url_alias_relatedId) data.relatedId = url_alias_relatedId;
        
        await strapi.db?.query('plugin::url-routes.route').update({
          where: { id: url_alias_routeId },
          data,
        });
      }
    },
  });
};