import type { ContentType, NavigationInput, NestedNavigation, NestedNavItem, Route, StructuredNavigationVariant } from "../../../types";
import duplicateCheck from "../utils/duplicateCheck";
import { getFullPath, buildStructuredNavigation, transformToUrl } from "../../../utils";
import { waRoute, waNavigation, waNavItem } from "../utils/pluginHelpers";
import { PLUGIN_ID } from "../../../pluginId";
import { createNavItem, updateNavItem, deleteNavItem } from "../utils/navItemHandler";
import { createExternalRoute } from "../utils/routeHandler";

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

    const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_ID });
    await pluginStore.set({ key: "config", value: newConfig });
  },

  async getConfig() {
    const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_ID });
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

  async getRelatedRoute(documentId: string) {
    try {
      return await strapi.db?.query(waRoute).findOne({
        where: {
          relatedDocumentId: documentId
        },
      });
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

        if (!navigation) throw new Error("Navigation not found");

        if (variant)
          navigation = buildStructuredNavigation(navigation, variant)
      } else {
        navigation =  await strapi.documents(waNavigation).findMany({
          populate: ['items', "items.route", "items.parent"],
        });

        if (!navigation) throw new Error("Navigation not found");

        if (variant) {
          navigation = navigation.map((nav: NestedNavigation) => buildStructuredNavigation(nav, variant))
        }
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
      const navigation =  await strapi.documents(waNavigation).findOne({
        documentId: documentId,
        populate: ['items'],
      })

      if (!navigation) throw new Error("Navigation not found");

      for (const item of navigation.items) {
        await strapi.documents(waNavItem).delete({
          documentId: item.documentId
        })
      }

      return await strapi.documents(waNavigation).delete({
        documentId: documentId
      })
    } catch (e) {
      console.log(e)
    }
  },

  async updateNavigationItemStructure(navigationId: string, navigationItems: NestedNavItem[]) {
    if (!navigationId || !navigationItems) return

    let error = false;

    let groupIndices: number[] = [];
    let parentIds: string[] = [];

    const newNavItemsMap = new Map<string, NestedNavItem>();

    for (const [index, item] of navigationItems.entries()) {
      if (item.deleted) {
        try {
          item.documentId && await deleteNavItem(item.documentId);
        } catch (error) {
          error = true;
          console.error('Error deleting navigation item ', error);
        }

        continue;
      }

      if (item.parent?.documentId.startsWith("temp-")) {
        const newItem = newNavItemsMap.get(item.parent.documentId);
        item.isNew.parent = newItem?.documentId
      }

      if (item.update && !item.isNew) {
        try {
          await this.updateRoute(item.route.documentId, {
            title: item.update.title || item.route.title,
            slug: item.update.slug || item.route.slug,
            fullPath: item.update.fullPath || item.route.fullPath,
            isOverride: item.update.isOverride !== undefined ? item.update.isOverride : item.route.isOverride,
          })
        } catch (error) {
          error = true;
          console.error('Error updating route ', error);
        }
      }

      const previousItem = navigationItems[index - 1];

      if (typeof item.depth !== 'number') {
        return
      }

      if (item.depth === 0) {
        if (groupIndices[0] !== undefined) {
          groupIndices[0] = groupIndices[0] + 1;
        } else {
          groupIndices[0] = 0
        }
        parentIds = [];
      } else if (typeof previousItem.depth === 'number' && item.depth === previousItem.depth + 1) {
        parentIds.push(previousItem.documentId);
        groupIndices[item.depth] = 0;
      } else if (typeof previousItem.depth === 'number' && item.depth <= previousItem.depth) {
        const diff = previousItem.depth - item.depth;
        for (let i = 0; i < diff; i++) {
          parentIds.pop();
          groupIndices.pop();
        }

        groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
      }
 
      try {
        if (item.isNew) {
          if (item.isNew.route) {
            await createNavItem({
              route: item.isNew.route,
              parent: item.isNew.parent,
              navigation: item.isNew.navigation,
              order: groupIndices[item.depth],
            });
          } else {
            const newRoute = await createExternalRoute({
                title: item.route.title,
                slug: item.route.slug,
                fullPath: item.route.fullPath,
                wrapper: item.route.wrapper,
                internal: item.route.internal,
                // isOverride: item.route.isOverride,
                // active: item.route.active,
            })

            const newNavItem = await createNavItem({
              route: newRoute.documentId,
              navigation: navigationId,
              parent: item.isNew.parent,
              order: groupIndices[item.depth],
            }) 
            if (newNavItem) newNavItemsMap.set(item.documentId, newNavItem);
          }
        } else {
          await updateNavItem(item.documentId, {
            navigation: undefined,
            route: undefined,
            order: groupIndices[item.depth] || 0,
            parent: parentIds.at(-1) || null,
          });
        }
      } catch (errorMsg) {
        error = true;
        console.error('Error updating navigation item ', errorMsg);
      }
    }

    return !error
  },


  async checkUniquePath(initialPath: string, targetRouteDocumentId: string | null = null) {
    try {
      return await duplicateCheck(initialPath, targetRouteDocumentId);
    } catch (e) {
      console.log(e)
    }
  },
})

