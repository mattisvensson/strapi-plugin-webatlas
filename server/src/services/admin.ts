import type { NavigationInput, NestedNavigation, NestedNavItem, PluginConfig, StructuredNavigationVariant } from "../../../types";
import { transformToUrl, waRoute, waNavigation, waNavItem, PLUGIN_ID } from "../../../utils";
import { handleItemDeletion, handleItemUpdate, buildStructuredNavigation, getExternalRouteIds, getRouteDescendants, duplicateCheck } from "../utils";

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

    const defaultConfig = strapi.config.get(`plugin::${PLUGIN_ID}`);

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

  async getRoute(documentId: string) {
    try {
      return await strapi.documents(waRoute).findOne({
        documentId: documentId,
      });
    } catch (e) {
      console.log(e)
    }
  },

  async getAllRoutes() {
    try {
      const entities = await strapi.documents(waRoute).findMany();
      return entities;
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
        populate: ['parent']
      });
    } catch (e) {
      console.log(e)
    }
  },

  async getRouteHierarchy(documentId: string) {
    try {
      const route = await strapi.documents(waRoute).findOne({
        documentId: documentId,
      });

      if (!route) throw new Error("Route not found");

      const descendants = await getRouteDescendants(route.documentId)
      const externalRouteIds = await getExternalRouteIds()

      return [route.documentId, ...descendants, ...externalRouteIds]

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

  async createNavigation(name: string, visible: boolean) {
    try {
      return await strapi.documents(waNavigation).create({
        data: {
          name: name,
          slug: transformToUrl(name),
          visible: visible,
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
    let newNavItemsMap = new Map<string, NestedNavItem>();

    // First pass: Validate and prepare items
    const deletionResult = await handleItemDeletion(navigationItems);
    if (!deletionResult.success) {
      console.error('Deletion errors:', deletionResult.errors);
    }

    navigationItems = deletionResult.items;

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

      const parent: NestedNavItem | null = calculatedParent ? await strapi.documents(waNavItem).findOne({
        documentId: calculatedParent,
        populate: ['route']
      }) : null;

      try {
        const result = await handleItemUpdate({
          item,
          parent,
          calculatedParent,
          calculatedOrder,
          navigationId,
          newNavItemsMap
        });
        if (!result.success) {
          console.error('Error updating item: ', item);
        }
        newNavItemsMap = result.newNavItemsMap;
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

