import { buildStructuredNavigation, extractRouteAndItems, getFullPopulateObject, cleanRootKeys, removeWaFields } from "../../../utils";
import { StructuredNavigationVariant } from "../../../types";
import { waRoute, waNavigation} from "../utils/pluginHelpers";

export default ({strapi}) => ({
  async getEntityByPath(slug: string, populate: string, populateDeepDepth: string, fields: any) {
    try {
      const route = await strapi.db?.query(waRoute).findOne({
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

      const entity = await strapi.documents(route.relatedContentType).findOne({
        documentId: route.documentIdPath,
        populate: populateObject,
        fields: fields
      });

      if (!entity) return null

      let cleanEntity = cleanRootKeys(entity)
      cleanEntity = removeWaFields(cleanEntity)

      return { contentType: contentType.info.singularName, ...cleanEntity }
    } catch (e) {
      console.log(e)
      return e
    }
  },
  async getNavigation(id: string, name: string, documentId: string, variant: StructuredNavigationVariant = 'nested') {
    try {
      let navigation = null
      
      if (documentId) {
        navigation = await strapi.documents(waNavigation).findOne({
          documentId: documentId,
          populate: ['items', "items.parent", "items.route"]
        });
      } else if (name) {
        navigation = await strapi.db?.query(waNavigation).findOne({
          where: { 
            name: name
          },
          populate: ['items', "items.parent", "items.route"],
        });
      } else if (id) {
        navigation = await strapi.db?.query(waNavigation).findOne({
          where: { 
            id: id
          },
          populate: ['items', "items.parent", "items.route"],
        });
      }
      
      if (!navigation) return null
      
      const structured = buildStructuredNavigation(navigation, variant)

      if (!structured) return null

      const entityNavigation = extractRouteAndItems(structured.items)

      return {...structured,  items: entityNavigation }
    } catch (e) {
      console.log(e)
      return e
    }
  },
})
