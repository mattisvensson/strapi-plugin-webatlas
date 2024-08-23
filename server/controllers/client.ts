import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
  async getEntityByPath(ctx) {
    try {
      const { slug } = ctx.query;
  
      if (!slug) return ctx.throw(400, 'Slug is required');

      const entity = await strapi.plugin('url-routes').service('client').getEntityByPath(slug);

      if (!entity) return ctx.throw(404, 'Entity not found');

      return ctx.send(entity);
    } catch (e) {
      ctx.throw(500, e)
    }
  },
});
