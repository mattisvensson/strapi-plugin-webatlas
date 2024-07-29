import { ContentType, Route } from "../../types";
import getFullPath from "../../utils/getFullPath";
import getNestedNavigation from "../../utils/getNestedNavigation";
import duplicateCheck from "../utils/duplicateCheck";

export default ({strapi}) => ({

  async updateConfig(newConfig) {
    if (!newConfig || !newConfig.selectedContentTypes) return
    
    try {
    const routes = await strapi.entityService.findMany('plugin::url-routes.route');
    const invalidRoutes = routes.filter((route: Route) => !newConfig.selectedContentTypes.find((type: ContentType) => type.uid === route.relatedContentType));

    invalidRoutes?.map(async (route: Route) => {
      await strapi.entityService.delete('plugin::url-routes.route', route.id)
    })
    } catch (err) {
      console.log(err)
      return "Error. Couldn't delete invalid routes"
    }

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

  async updateRoute(id, data) {
    const parent = data.parent ? await strapi.entityService.findOne('plugin::url-routes.navitem', data.parent, {
      populate: ['route'],
    }) : null;

    let fullPath = getFullPath(parent?.fullPath, data.slug)
    
    if (data.isOverride) fullPath = data.slug;

    try {
      const entity = await strapi.entityService.update('plugin::url-routes.route', id, {
        data: {
          title: data.title,
          slug: data.slug,
          isOverride: data.isOverride,
          fullPath,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async getNavigation(id) {
    try {
      const entity = await strapi.entityService.findOne('plugin::url-routes.navigation', id, {
        populate: ['items', "items.parent"],
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async getAllNavigations() {
    try {
      const entity = await strapi.entityService.findMany('plugin::url-routes.navigation', {
        populate: ['items', "items.parent"],
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
      if (!data.route || !data.navigation) return false

      const routeId = Number(data.route)

      const parent = data.parent ? await strapi.entityService.findOne('plugin::url-routes.navitem', data.parent, {
        populate: ['route'],
      }) : null;

      const route = routeId ? await strapi.entityService.findOne('plugin::url-routes.route', routeId, {
        populate: ['route'],
      }) : null;

      const fullPath = route.isOverride ? route.fullPath : getFullPath(parent?.route?.fullPath, route.fullPath)

      await strapi.entityService.update('plugin::url-routes.route', routeId, {
        data: {
          fullPath,
        },
      });
      console.log(route)

      const entity = await strapi.entityService.create('plugin::url-routes.navitem', {
        data: {
          navigation: Number(data.navigation),
          route: routeId,
          parent: data.parent ? Number(data.parent) : null,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async createNavItemRoute(data) {
    try {
      const route = await strapi.entityService.findOne('plugin::url-routes.route', data.navitem.route);

      const newRouteData = {
        relatedContentType: route.relatedContentType,
        relatedId: route.relatedId,
        title: data.route.title,
        slug: data.route.slug,
        isOverride: true,
        internal: data.route.internal,
        active: data.route.active,      
      }

      const newRoute = await this.createRoute(newRouteData)

      const entity = await strapi.entityService.create('plugin::url-routes.navitem', {
        data: {
          navigation: Number(data.navitem.navigation),
          route: Number(newRoute.id),
          parent: data.parent ? Number(data.navite.parent) : null,
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

  async checkUniquePath(initialPath: string, targetRouteId: number | null = null) {
    try {
      return await duplicateCheck(initialPath, targetRouteId);
    } catch (e) {
      console.log(e)
    }
  },
})

