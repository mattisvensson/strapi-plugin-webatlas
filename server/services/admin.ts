import getNestedNavigation from "../../utils/getNestedNavigation";

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

  async getRoutes() {
    try {
      const entitys = await strapi.entityService.findMany('plugin::url-routes.route', {
        populate: ['parent', 'navigation'],
      });
      return entitys;
    } catch (e) {
      console.log(e)
    }
  },

  async createRoute(data) {
    // const urlPath = await duplicateCheck(data.url_path);
    try {
      const entity = await strapi.entityService.create('plugin::url-routes.route', {
        data: {
          relatedContentType: data.relatedContentType,
          relatedId: data.relatedId,
          title: data.title,
          path: data.path,
          menuAttached: data.menuAttached,
          navigation: data.navigation.map((id: string) => ({ id: Number(id) })),
          parent: data.parent ? { id: Number(data.parent) } : null,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async updateRoute(id, data) {
    // const urlPath = await duplicateCheck(data.url_path, id);
    try {
      const entity = await strapi.entityService.update('plugin::url-routes.route', id, {
        data: {
          relatedContentType: data.relatedContentType,
          relatedId: data.relatedId,
          title: data.title,
          path: data.path,
          menuAttached: data.menuAttached,
          navigation: data.navigation.map((id: string) => ({ id: Number(id) })),
          parent: data.parent ? { id: Number(data.parent) } : null,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async deleteRoute(id: number) {
    try {
      const entity = await strapi.entityService.delete('plugin::url-routes.route', id);
      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async getNavigation(id) {
    try {
      const entity = await strapi.entityService.findOne('plugin::url-routes.navigation', id, {
        populate: ['items', "items.parent", "items.navigation"],
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async getAllNavigations() {
    try {
      const entity = await strapi.entityService.findMany('plugin::url-routes.navigation', {
        populate: ['items', "items.parent", "items.navigation"],
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async createNavigation(data) {
    try {
      await strapi.entityService.create('plugin::url-routes.navigation', {
        data: {
          name: data.name,
          slug: data.name,
          visible: data.isActive,
        },
      });
      return true
    } catch (e) {
      console.log(e)
    }
  },

  async updateNavigation(id, data) {
    try {
      const entity = await strapi.entityService.update('plugin::url-routes.navigation', id, {
        data: {
          name: data.name,
          slug: data.slug,
          visible: data.isActive,
        },
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async deleteNavigation(id) {
    try {
      await strapi.entityService.delete('plugin::url-routes.navigation', id)
      return true
    } catch (e) {
      console.log(e)
    }
  },

  async nestedNavigation(id) {
    try {
      const navigation = await strapi.entityService.findOne('plugin::url-routes.navigation', id, {
        populate: ['items', "items.parent", "items.route"],
      });

      return getNestedNavigation(navigation)
    } catch (e) {
      console.log(e)
    }
  },

  async createNavItem(data) {
    try {
      const entity = await strapi.entityService.create('plugin::url-routes.navitem', {
        data: {
          navigation: data.navigation ? Number(data.navigation) : null,
          route: data.route ? Number(data.route) : null,
          parent: data.parent ? Number(data.parent) : null,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async updateNavItem(id, data) {
    try {
      const entity = await strapi.entityService.update('plugin::url-routes.navitem', id, {
        data: {
          navigation: data.navigation ? Number(data.navigation) : null,
          route: data.route ? Number(data.route) : null,
          parent: data.parent ? Number(data.parent) : null,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async deleteNavItem(id) {
    try {
      await strapi.entityService.delete('plugin::url-routes.navitem', id)
      return true
    } catch (e) {
      console.log(e)
    }
  },
})
