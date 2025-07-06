import { getAdminService } from '../utils/pluginHelpers';
import type { Core } from '@strapi/strapi';

const admin = ({ strapi }: { strapi: Core.Strapi }) => ({
  async updateConfig(ctx) {
    try {
      await getAdminService().updateConfig(ctx.request.body);
    } catch (e) {
      ctx.throw(500, e)
    }
    return ctx.send({ status: 200 });
  },
  async getConfig(ctx) {
    try {
      return await getAdminService().getConfig();
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getRoutes(ctx) {
    try {
      return await getAdminService().getRoutes();
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async createExternalRoute (ctx) {
    try {
      const { data } = ctx.request.body;
      return await getAdminService().createExternalRoute(
        data,
      );
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async updateRoute (ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      return await getAdminService().updateRoute(
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
      return await getAdminService().getNavigation(id);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getAllNavigations (ctx) {
    try {
      return await getAdminService().getAllNavigations();
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async createNavigation (ctx) {
    try {
      const data = ctx.request.body;
      return await getAdminService().createNavigation(data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async updateNavigation (ctx) {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;
      return await getAdminService().updateNavigation(id, data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async structuredNavigation (ctx) {
    try {
      const { variant } = ctx.query;
      const { id } = ctx.params;
      return await getAdminService().structuredNavigation(id, variant);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async deleteNavigation (ctx) {
    try {
      const { id } = ctx.params;
      return await getAdminService().deleteNavigation(id);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async createNavItem (ctx) {
    try {
      const { data } = ctx.request.body;
      return await getAdminService().createNavItem(data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async updateNavItem (ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      return await getAdminService().updateNavItem(id, data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async deleteNavItem (ctx) {
    try {
      const { id } = ctx.params;
      return await getAdminService().deleteNavItem(id);
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
      
      return await getAdminService().checkUniquePath(bodyPath || queryPath, bodyTargetRouteId || queryTargetRouteId || null);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});

export default admin;