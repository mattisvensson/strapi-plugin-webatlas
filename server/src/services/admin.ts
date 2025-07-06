import { ContentType, Route, StructuredNavigationVariant } from "../../../types";
import duplicateCheck from "../utils/duplicateCheck";
import { getFullPath, buildStructuredNavigation } from "../../../utils";
import { waRoute, waNavigation, waNavItem } from "../utils/pluginHelpers";

export default ({strapi}) => ({

  async updateConfig(newConfig) {
    if (!newConfig || !newConfig.selectedContentTypes) return
    
    try {
      const routes = await strapi.entityService.findMany(waRoute);
      const invalidRoutes = routes.filter((route: Route) => !newConfig.selectedContentTypes.find((type: ContentType) => type.uid === route.relatedContentType));
  
      invalidRoutes?.map(async (route: Route) => {
        await strapi.entityService.delete(waRoute, route.id)
      })
    } catch (err) {
      console.log(err)
      return "Error. Couldn't delete invalid routes"
    }

    const pluginStore = await strapi.store({ type: 'plugin', name: 'webatlas' });
    await pluginStore.set({ key: "config", value: newConfig });
  },

  async getConfig() {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'webatlas' });
    const config = await pluginStore.get({
      key: "config",
    });
    return config
  },

  async getRoutes() {
    try {
      const entitys = await strapi.entityService.findMany(waRoute, {
        populate: ['parent', 'navigation'],
      });
      return entitys;
    } catch (e) {
      console.log(e)
    }
  },

  async createExternalRoute(data) {
    try {
      const newRoute = await strapi.entityService.create(waRoute, {
        data: {
          title: data.title,
          slug: data.fullPath,
          fullPath: data.fullPath,
          relatedContentType: '',
          relatedId: 0,
          uidPath: '',
          internal: data.internal,
          wrapper: data.wrapper,
        },
      });
      return newRoute
    } catch (e) {
      console.log(e)
    }
  },

  async updateRoute(id, data) {
    try {
      let checkedPath = data.fullPath
      
      if (data.internal) {
        const parent = data.parent ? await strapi.entityService.findOne(waNavItem, data.parent) : null;
        
        const fullPath = data.isOverride ? data.slug : getFullPath(parent?.fullPath, data.slug)
        checkedPath = await duplicateCheck(fullPath, id);
      }

      const entity = await strapi.entityService.update(waRoute, id, {
        data: {
          ...data,
          fullPath: checkedPath,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async getNavigation(id) {
    try {
      const entity = await strapi.entityService.findOne(waNavigation, id, {
        populate: ['items', "items.parent"],
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async getAllNavigations() {
    try {
      const entity = await strapi.entityService.findMany(waNavigation, {
        populate: ['items', "items.parent"],
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async createNavigation(data) {
    try {
      await strapi.entityService.create(waNavigation, {
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
      const entity = await strapi.entityService.update(waNavigation, id, {
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
      await strapi.entityService.delete(waNavigation, id)
      return true
    } catch (e) {
      console.log(e)
    }
  },

  async structuredNavigation(id: number, variant: StructuredNavigationVariant) {
    try {
      const navigation = await strapi.entityService.findOne(waNavigation, id, {
        populate: ['items', "items.parent", "items.route"],
      });

      return buildStructuredNavigation(navigation, variant)
    } catch (e) {
      console.log(e)
    }
  },

  async createNavItem(data) {
    try {
      if (!data.route || !data.navigation) return false

      const routeId = Number(data.route)

      const parent = data.parent ? await strapi.entityService.findOne(waNavItem, data.parent, {
        populate: ['route'],
      }) : null;

      const route = routeId ? await strapi.entityService.findOne(waRoute, routeId, {
        populate: ['route'],
      }) : null;

      let fullPath = route.slug

      if (route.internal && !route.isOverride && parent?.route.internal) fullPath = getFullPath(parent?.route?.fullPath, route.slug)

      await strapi.entityService.update(waRoute, routeId, {
        data: {
          fullPath,
        },
      });

      const entity = await strapi.entityService.create(waNavItem, {
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

  async updateNavItem(id, data) {
    try {
      const entity = await strapi.entityService.update(waNavItem, id, {
        data: {
          navigation: data.navigation ? Number(data.navigation) : null,
          route: data.route ? Number(data.route) : null,
          parent: data.parent ? Number(data.parent) : null,
          order: data.order ? Number(data.order) : 0,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async deleteNavItem(id) {
    try {
      await strapi.entityService.delete(waNavItem, id)
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

