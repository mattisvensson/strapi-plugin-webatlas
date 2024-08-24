import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
  async getEntityByPath(ctx) {
    try {
      const { slug, populate, populateDeepDepth, fields } = ctx.query;

      if (!slug) return ctx.throw(400, 'Slug is required');

      const entity = await strapi.plugin('url-routes').service('client').getEntityByPath(slug, populate, populateDeepDepth, fields);

      if (!entity) return ctx.throw(404, 'Entity not found');

      return ctx.send(entity);
    } catch (e) {
      ctx.throw(500, e)
    }
  },
  async getNavigation (ctx) {
    try {
      const { id } = ctx.params;
      const { variant } = ctx.query;

      if (!id) return ctx.throw(400, 'Navigation id is required');

      const navigation = await strapi.plugin('url-routes').service('client').getNavigation(id, variant);

      if (!navigation) return ctx.throw(404, 'Navigation not found');

      return ctx.send(navigation);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});
