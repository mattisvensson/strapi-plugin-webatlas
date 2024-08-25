import { buildStructuredNavigation, extractRouteAndItems, getFullPopulateObject, cleanRootKeys } from "../../utils";
import { StructuredNavigationVariant } from "../../types";

export default ({strapi}) => ({
  async getEntityByPath(slug: string, populate: string, populateDeepDepth: string, fields: any) {
    try {
      const route = await strapi.db?.query('plugin::url-routes.route').findOne({
        filters: { 
          $or: [
            { fullPath: slug},
            { slug: slug },
            { uidPath: slug },
          ], 
        },
      });

      if (!route) return null
      
      let populateObject: string | Record<string, boolean | Record<string, any>> = populate
      
      if (populate === 'deep') {
        const modelObject = getFullPopulateObject(route.relatedContentType, Number(populateDeepDepth), []);
        if (typeof modelObject === 'object' && 'populate' in modelObject) {
          populateObject = modelObject.populate;
        }
      }
      
      const contentTypeObject: any = Object.entries(strapi.contentTypes).find(([key, value]) => key === route.relatedContentType)
      
      if (!contentTypeObject) {
        return null
      }      
      
      const [contentTypeKey, contentType] = contentTypeObject;
      
      const entity = await strapi.entityService.findOne(route.relatedContentType, route.relatedId, {
        populate: populateObject,
        fields: fields,
      });
      
      if (!entity) return null

      const cleanEntity = cleanRootKeys(entity)

      return { contentType: contentType.info.singularName, ...cleanEntity }
    } catch (e) {
      console.log(e)
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
      console.log(e)
      return e
    }
  },
})
