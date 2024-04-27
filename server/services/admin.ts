/**
 * Finds a path from the original path that is unique
 */
// const duplicateCheck = async (
//   originalPath: string,
//   ignoreId?: Entity.ID,
//   ext: number = -1,
// ): Promise<string> => {
//   const extension = ext >= 0 ? `-${ext}` : '';
//   const newPath = originalPath + extension;
//   const pathAlreadyExists = await getPluginService('urlAliasService').findByPath(newPath, ignoreId);

//   if (pathAlreadyExists) {
//     return duplicateCheck(originalPath, ignoreId, ext + 1);
//   }

//   return newPath;
// };

export default ({strapi}) => ({

  async updateConfig(newConfig) {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'url-routes' });
    await pluginStore.set({ key: "config", value: newConfig });
  },

  async getConfig() {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'url-routes' });
    const config = await pluginStore.get({
      key: "config",
    });
    return config
  },

  async createRoute(newData) {
    // const urlPath = await duplicateCheck(data.url_path);
    try {
      const entity = await strapi.entityService.create('plugin::url-routes.route', {
        data: {
          relatedContentType: newData.contentType,
          relatedId: newData.id,
          title: newData.title,
          path: newData.url_route,
          menuAttached: newData.menuAttached,
        },
      });

      await strapi.entityService.update(newData.contentType, newData.id, {
        data: {
          url_route: {
            ...newData,
            routeId: entity.id,
          }
        },
      });
    
      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async updateRoute(newData, contentType) {
    // const urlPath = await duplicateCheck(data.url_path, id);
    try {
      const entity = await strapi.entityService.update('plugin::url-routes.route', newData.routeId, {
        data: {
          relatedContentType: contentType,
          relatedId: newData.id,
          title: newData.title,
          path: newData.url_route,
          menuAttached: newData.menuAttached,
        },
      });
  
      await strapi.entityService.update(contentType, newData.id, {
        data: {
          url_route: newData,
        },
      });
    
      return entity;
    } catch (e) {
      console.log(e)
    }
  }
})