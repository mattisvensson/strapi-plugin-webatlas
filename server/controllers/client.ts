import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
  async getEntityByPath(ctx) {
    const { slug } = ctx.query;
    try {
      const entity = await strapi.plugin('url-routes').service('client').getEntityByPath(slug);

      return ctx.send(entity);
    } catch (e) {
      ctx.throw(500, e)
    }
  },
});
