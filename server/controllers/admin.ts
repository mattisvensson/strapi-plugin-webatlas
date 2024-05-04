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
  async getRoutes(ctx) {
    try {
      return await strapi.plugin('url-routes').service('admin').getRoutes();
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async createRoute(ctx) {
    try {
      const { data } = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').createRoute(data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async updateRoute (ctx) {
    try {
      const { data, contentType } = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').updateRoute(
        data,
        contentType,
      );
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async createNavigation (ctx) {
    try {
      const data = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').createNavigation(data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async updateNavigation (ctx) {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').updateNavigation(id, data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async deleteNavigation (ctx) {
    try {
      const { id } = ctx.params;
      return await strapi.plugin('url-routes').service('admin').deleteNavigation(id);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});
