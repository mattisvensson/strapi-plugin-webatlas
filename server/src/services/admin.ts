import type { ContentType, NavigationInput, NavItemSettings, NestedNavigation, Route, StructuredNavigationVariant } from "../../../types";
import duplicateCheck from "../utils/duplicateCheck";
import { getFullPath, buildStructuredNavigation, transformToUrl } from "../../../utils";
import { waRoute, waNavigation, waNavItem } from "../utils/pluginHelpers";
import { PLUGIN_ID } from "../../../pluginId";

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

  async createExternalRouteAndNavItem(
    {routeData, navItemData}: 
    {routeData: any, navItemData: Omit<NavItemSettings, 'route'>}
  ) {
    let route = null
    try {
      route = await this.createExternalRoute(routeData)
      await this.createNavItem({
        route: route.documentId,
        navigation: navItemData.navigation,
        parent: navItemData.parent,
        order: navItemData.order,
      })
      return true
    } catch (e) {
      console.log(e)
      route.documentId && this.deleteRoute(route.documentId)
    }
  },

  async deleteRoute(routeId) {
    try {
      await strapi.documents(waRoute).delete({
        documentId: routeId
      })
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
          item.documentId && await this.deleteNavItem(item.documentId);
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
            await this.createNavItem({
              route: item.isNew.route,
              parent: item.isNew.parent,
              navigation: item.isNew.navigation,
              order: groupIndices[item.depth],
            });
          } else {
            const newRoute = await this.createExternalRoute({
                title: item.route.title,
                slug: item.route.slug,
                fullPath: item.route.fullPath,
                wrapper: item.route.wrapper,
                internal: item.route.internal,
                // isOverride: item.route.isOverride,
                // active: item.route.active,
            })

            const newNavItem = await this.createNavItem({
              route: newRoute.documentId,
              navigation: navigationId,
              parent: item.isNew.parent,
              order: groupIndices[item.depth],
            }) 
            
            newNavItemsMap.set(item.documentId, newNavItem);
          }
        } else {
          await this.updateNavItem(item.documentId, {
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
      const updateData: any = {};
      if (data.navigation !== undefined && data.navigation !== null && data.navigation !== '') updateData.navigation = data.navigation;
      if (data.route !== undefined && data.route !== null && data.route !== '') updateData.route = data.route;
      if (data.parent !== undefined) updateData.parent = data.parent;
      if (data.order !== undefined && typeof data.order === 'number') updateData.order = data.order;

      return await strapi.documents(waNavItem).update({
        documentId: documentId,
        data: updateData
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

