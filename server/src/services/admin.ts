import type { NavigationInput, NestedNavigation, NestedNavItem, PluginConfig, StructuredNavigationVariant } from "../../../types";
import duplicateCheck from "../utils/duplicateCheck";
import { getFullPath, buildStructuredNavigation, transformToUrl } from "../../../utils";
import { PLUGIN_ID } from "../../../pluginId";
import { reduceDepthOfOrphanedItems, createExternalRoute, createNavItem, updateNavItem, deleteNavItem, waRoute, waNavigation, waNavItem } from "../utils";

export default ({strapi}) => ({

  async updateConfig(newConfig: Partial<PluginConfig>) {
    if (!newConfig) return;
      
    let newConfigMerged: PluginConfig;

    try {
      const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_ID });
      const config = await pluginStore.get({ key: "config" });
      newConfigMerged = { ...config, ...newConfig };
      await pluginStore.set({ key: "config", value: newConfigMerged });
      
    } catch (err) {
      console.log(err);
      return "Error. Couldn't update config";
    }

    // TODO: Is it necessary/intended to delete/mark invalid routes here? 
    // if (newConfigMerged.selectedContentTypes) {
    //   try {
    //     const routes = await strapi.documents(waRoute).findMany();
    //     const invalidRoutes = routes.filter((route: Route) =>
    //       route.internal && !newConfigMerged.selectedContentTypes.find((type) => type.uid === route.relatedContentType)
    //     );
    //     for (const route of invalidRoutes) {
    //       // await strapi.documents(waNavItem).deleteMany({
    //       //   where: {
    //       //     route: route.documentId
    //       //   }
    //       // });
    //       // await strapi.documents(waRoute).delete({ documentId: route.documentId });
    //     }
    //   } catch (err) {
    //     console.log(err);
    //   }
    // }

    return newConfigMerged;
  },

  async getConfig() {
    const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_ID });
    let config = await pluginStore.get({
      key: "config",
    });
    
    const defaultConfig = strapi.config.get('plugin::webatlas');

    config = {
      ...defaultConfig,
      ...config,
      navigation: {
        ...defaultConfig.navigation,
        ...config?.navigation
      }
    };

    return config;
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

  async getNavigation(documentId?: string, variant?: StructuredNavigationVariant | "namesOnly") {
    try {

      let navigation = null

      if (variant === "namesOnly") {
        if (documentId) {
          return await strapi.documents(waNavigation).findOne({
            documentId: documentId,
            select: ['documentId', 'name', 'slug', 'visible'],
          });
        }
        return await strapi.documents(waNavigation).findMany({
          select: ['documentId', 'name', 'slug', 'visible'],
        });
      }

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
      return await strapi.documents(waNavigation).create({
        data: {
          name: data.name,
          slug: transformToUrl(data.name),
          visible: data.isActive,
        },
      });
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
    const newNavItemsMap = new Map<string, NestedNavItem>();
    
    // First pass: Validate and prepare items
    for (const [index, item] of navigationItems.entries()) {
      // Handle deletions
      if (item.deleted) {
        try {
          item.documentId && await deleteNavItem(item.documentId);

          const newItems = reduceDepthOfOrphanedItems(navigationItems, item.documentId);

          if (!newItems) throw new Error("Failed to reduce depth of orphaned items");
        
          navigationItems = newItems;
          
        } catch (error) {
          error = true;
          console.error('Error deleting navigation item ', error);
        }
        continue;
      }

      // Handle items without routes (cleanup)
      // This is a quick fix to remove nav items without route
      // Ideally, nav items without route shouldn't be created at all
      // TODO: Find out why nav items without route can exist
      if (!item.route && item.documentId) {
        try {
          console.warn('Navigation item without route found. Deleting it. ', item);
          await deleteNavItem(item.documentId);
        } catch (error) {
          console.error('Error deleting navigation item without route ', error);
        }
        continue;
      }

      // Handle route updates for existing items
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
    }

    // Second pass: Process items sequentially and maintain parent/depth tracking
    let parentIds: string[] = [];
    let groupIndices: number[] = [];

    for (const [index, item] of navigationItems.entries()) {
      if (typeof item.depth !== 'number') {
        continue;
      }

      // Handle depth changes and maintain parent stack
      if (item.depth === 0) {
        if (groupIndices[0] !== undefined) {
          groupIndices[0] = groupIndices[0] + 1;
        } else {
          groupIndices[0] = 0;
        }
        parentIds = [];
      } else {
        const previousItem = navigationItems[index - 1];
        
        if (previousItem && typeof previousItem.depth === 'number') {
          if (item.depth === previousItem.depth + 1) {
            // Going deeper - previous item becomes parent
            parentIds.push(previousItem.documentId.startsWith("temp-") 
              ? newNavItemsMap.get(previousItem.documentId)?.documentId || previousItem.documentId
              : previousItem.documentId);
            groupIndices[item.depth] = 0;
          } else if (item.depth <= previousItem.depth) {
            // Going back up - adjust parent stack
            const diff = previousItem.depth - item.depth;
            for (let i = 0; i < diff; i++) {
              parentIds.pop();
              groupIndices.pop();
            }
            groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
          } else {
            // Same level or other case
            groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1;
          }
        }
      }

      const calculatedParent = parentIds.at(-1) || null;
      const calculatedOrder = groupIndices[item.depth] || 0;

      try {
        // Create or update the item
        if (item.isNew) {
          if (item.isNew.route) {
            await createNavItem({
              route: item.isNew.route,
              parent: calculatedParent,
              navigation: item.isNew.navigation,
              order: calculatedOrder,
            });
          } else {
            const newRoute = await createExternalRoute({
                title: item.route.title,
                slug: item.route.slug,
                fullPath: item.route.fullPath,
                wrapper: item.route.wrapper,
                internal: item.route.internal,
            })

            const newNavItem = await createNavItem({
              route: newRoute.documentId,
              navigation: navigationId,
              parent: calculatedParent,
              order: calculatedOrder,
            }) 
            if (newNavItem) newNavItemsMap.set(item.documentId, newNavItem);
          }
        } else {
          await updateNavItem(item.documentId, {
            order: calculatedOrder,
            parent: calculatedParent,
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

