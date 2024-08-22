export default ({strapi}) => ({
  async getEntityByPath(slug: string) {
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

      if (!entity) {
        throw new Error('Entity not found')
      }
      
      const contentType = await strapi.entityService.findOne(entity.relatedContentType, entity.relatedId);

      return contentType
    } catch (e) {
      return e
    }
  },
})

