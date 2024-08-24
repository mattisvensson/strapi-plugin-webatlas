import { buildStructuredNavigation, extractRouteAndItems, getFullPopulateObject } from "../../utils";
import { StructuredNavigationVariant } from "../../types";

export default ({strapi}) => ({
  async getEntityByPath(slug: string, populate: string, populateDeepDepth: string) {
    try {
      const entities = await strapi.entityService.findMany('plugin::url-routes.route', {
        filters: { 
          $or: [
            {
              fullPath: slug,
            },
            {
              slug: slug,
            },
            {
              uidPath: slug,
            },
          ], 
        },
      });

      const entity = entities[0]

      if (!entity) return null

      let populateObject = {}

      if (populate === 'deep') {
        const modelObject = getFullPopulateObject(entity.relatedContentType, Number(populateDeepDepth), []);
        if (typeof modelObject === 'object' && 'populate' in modelObject) {
          populateObject = modelObject.populate;
        }
      }

      const contentType = await strapi.entityService.findOne(entity.relatedContentType, entity.relatedId, {
        populate: populateObject,
      });

      if (!contentType) return null

      return contentType
    } catch (e) {
      return e
    }
  },
  async getNavigation(id: string, variant: StructuredNavigationVariant = 'nested') {
    try {
      const navigation = await strapi.entityService.findOne('plugin::url-routes.navigation', id, {
        populate: ['items', "items.parent", "items.route"],
      });

      if (!navigation) return null

      const structured = buildStructuredNavigation(navigation, variant)

      if (!structured) return null

      const entityNavigation = extractRouteAndItems(structured.items)

      return entityNavigation
    } catch (e) {
      return e
    }
  },
})
