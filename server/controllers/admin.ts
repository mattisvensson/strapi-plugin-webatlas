import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
  async updateConfig(ctx) {
    try {
      await strapi.plugin('url-routes').service('admin').updateConfig(ctx.request.body);
    } catch (e) {
      ctx.throw(500, e)
    }
    return ctx.send({ status: 200 });
  },
  async getConfig(ctx) {
    try {
      return await strapi.plugin('url-routes').service('admin').getConfig();
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});
