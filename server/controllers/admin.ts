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
  async updateRoute (ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').updateRoute(
        id,
        data,
      );
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getNavigation (ctx) {
    try {
      const { id } = ctx.params;
      return await strapi.plugin('url-routes').service('admin').getNavigation(id);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getAllNavigations (ctx) {
    try {
      return await strapi.plugin('url-routes').service('admin').getAllNavigations();
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
  async nestedNavigation (ctx) {
    try {
      const { id } = ctx.params;
      return await strapi.plugin('url-routes').service('admin').nestedNavigation(id);
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
  async createNavItem (ctx) {
    try {
      const { data } = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').createNavItem(data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async createNavItemRoute (ctx) {
    try {
      const { data } = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').createNavItemRoute(data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async updateNavItem (ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      return await strapi.plugin('url-routes').service('admin').updateNavItem(id, data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async deleteNavItem (ctx) {
    try {
      const { id } = ctx.params;
      return await strapi.plugin('url-routes').service('admin').deleteNavItem(id);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async checkUniquePath (ctx) {
    try {
      const queryPath = ctx.query.path
      const bodyPath = ctx.request.body.path
      const queryTargetRouteId = ctx.query.targetRouteId
      const bodyTargetRouteId = ctx.request.body.targetRouteId

      if (!queryPath && !bodyPath) {
        return ctx.throw(400, 'Path is required')
      }
      
      return await strapi.plugin('url-routes').service('admin').checkUniquePath(bodyPath || queryPath, bodyTargetRouteId || queryTargetRouteId || null);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});
