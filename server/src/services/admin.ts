import { ContentType, NavigationInput, NavItemSettings, Route, StructuredNavigationVariant } from "../../../types";
import duplicateCheck from "../utils/duplicateCheck";
import { getFullPath, buildStructuredNavigation, transformToUrl } from "../../../utils";
import { waRoute, waNavigation, waNavItem } from "../utils/pluginHelpers";
import { PLUGIN_NAME } from "../../../pluginId";

export default ({strapi}) => ({

  async updateConfig(newConfig) {
    if (!newConfig || !newConfig.selectedContentTypes) return

    try {
      const routes = await strapi.documents(waRoute).findMany();
      const invalidRoutes = routes.filter((route: Route) => !newConfig.selectedContentTypes.find((type: ContentType) => type.uid === route.relatedContentType));

      invalidRoutes?.map(async (route: Route) => {
        await strapi.documents(waRoute).delete({
          documentId: route.documentId
        })
      })
    } catch (err) {
      console.log(err)
      return "Error. Couldn't delete invalid routes"
    }

    const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_NAME });
    await pluginStore.set({ key: "config", value: newConfig });
  },

  async getConfig() {
    const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_NAME });
    let config = await pluginStore.get({
      key: "config",
    });

    if (!config) {
      config = await pluginStore.set({
        key: "config",
        value: {
          selectedContentTypes: [],
        },
      });
    }

    return config
  },

  async getRoutes() {
    try {
      // TODO: populate parent and navigation?
      const entities = await strapi.documents(waRoute).findMany();
      return entities;
    } catch (e) {
      console.log(e)
    }
  },

  async createExternalRoute(data) {
    try {
      return await strapi.documents(waRoute).create({
        data: {
          title: data.title,
          slug: data.fullPath,
          fullPath: data.fullPath,
          relatedContentType: '',
          relatedId: 0,
          relatedDocumentId: '',
          uidPath: '',
          internal: false,
          wrapper: data.wrapper,
        },
      });
    } catch (e) {
      console.log(e)
    }
  },

  async updateRoute(documentId: string, data: any) {
    try {
      let checkedPath = data.fullPath

      if (data.internal) {
        const parent = data.parent ? await strapi.documents(waNavItem).findOne({
          documentId: data.parent
        }) : null;
        
        const fullPath = data.isOverride ? data.slug : getFullPath(parent?.fullPath, data.slug)
        checkedPath = await duplicateCheck(fullPath, documentId);
      }

      const entity = await strapi.documents(waRoute).update({
        documentId: documentId,
        data: {
          ...data,
          fullPath: checkedPath,
        }
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async getNavigation(documentId?: string, variant?: StructuredNavigationVariant) {
    try {

      let navigation = null

      if (documentId) {
        navigation = await strapi.documents(waNavigation).findOne({
          documentId: documentId,
          populate: ['items', "items.route", "items.parent"]
        });
      } else {
        navigation =  await strapi.documents(waNavigation).findMany({
          populate: ['items', "items.route", "items.parent"],
        });
      }

      if (!navigation) throw new Error("Navigation not found");

      if (variant) {
        navigation = buildStructuredNavigation(navigation, variant)
      }

      return navigation
    } catch (e) {
      console.log(e)
    }
  },

  async createNavigation(data) {
    try {
      const navigation = await strapi.documents(waNavigation).create({
        data: {
          name: data.name,
          slug: transformToUrl(data.name),
          visible: data.isActive,
        },
      });
      return navigation
    } catch (e) {
      console.log(e)
    }
  },

  async updateNavigation(documentId: string, data: NavigationInput) {
    try {
      const entity = await strapi.documents(waNavigation).update({
        documentId: documentId,
        data: {
          name: data.name,
          visible: data.visible,
        }
      });
      return entity
    } catch (e) {
      console.log(e)
    }
  },

  async deleteNavigation(documentId: string) {
    try {
      return await strapi.documents(waNavigation).delete({
        documentId: documentId
      })
    } catch (e) {
      console.log(e)
    }
  },

  async createNavItem(data: NavItemSettings) {
    try {
      if (!data.route || !data.navigation) return false

      const parent = data.parent ? await strapi.documents(waNavItem).findOne({
        documentId: data.parent,
        populate: ['route']
      }) : null;

      const route = data.route ? await strapi.documents(waRoute).findOne({
        documentId: data.route
      }) : null;

      let fullPath = route.slug

      if (route.internal && !route.isOverride && parent?.route.internal) fullPath = getFullPath(parent?.route?.fullPath, route.slug)

      await strapi.documents(waRoute).update({
        documentId: data.route,
        data: {
          fullPath,
        }
      });

      // TODO: Update webatlas fields in related entity
      // await strapi.documents(route.relatedContentType).update({
      //   documentId: route.relatedDocumentId,
      //   data: {
      //     webatlas_path: fullPath
      //   }
      // });

      const entity = await strapi.documents(waNavItem).create({
        data: {
          navigation: data.navigation,
          route: data.route || null,
          parent: data.parent || null,
        },
      });

      return entity;
    } catch (e) {
      console.log(e)
    }
  },

  async updateNavItem(documentId: string, data: NavItemSettings) {
    try {
      return await strapi.documents(waNavItem).update({
        documentId: documentId,
        data: {
          navigation: data.navigation || null,
          route: data.route || null,
          parent: data.parent || null,
          order: data.order || 0,
        }
      });
    } catch (e) {
      console.log(e)
    }
  },

  async deleteNavItem(documentId: string) {
    try {
      await strapi.documents(waNavItem).delete({
        documentId: documentId
      })
      return true
    } catch (e) {
      console.log(e)
    }
  },

  async checkUniquePath(initialPath: string, targetRouteDocumentId: string | null = null) {
    try {
      return await duplicateCheck(initialPath, targetRouteDocumentId);
    } catch (e) {
      console.log(e)
    }
  },
})

