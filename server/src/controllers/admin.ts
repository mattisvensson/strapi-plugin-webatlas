import { getAdminService } from '../utils/pluginHelpers';

const admin = () => ({
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
  async updateRoute (ctx) {
    try {
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'Route documentId is required');

      const { data } = ctx.request.body;
      return await getAdminService().updateRoute(documentId, data);
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
  async createExternalRouteAndNavItem (ctx) {
    try {
      const { data } = ctx.request.body;

      if (!data || !data.routeData || !data.navItemData) {
        return ctx.throw(400, 'Both routeData and navItemData are required');
      }

      return await getAdminService().createExternalRouteAndNavItem(
        { routeData: data.routeData, navItemData: data.navItemData },
      );
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getRelatedRoute (ctx) {
    try {
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'Route documentId is required');

      return await getAdminService().getRelatedRoute(documentId);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getNavigation (ctx) {
    try {
      const { documentId, variant } = ctx.query;

      return await getAdminService().getNavigation(documentId, variant);
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
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'Navigation documentId is required');

      const { data } = ctx.request.body;
      return await getAdminService().updateNavigation(documentId, data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async deleteNavigation (ctx) {
    try {
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'Navigation documentId is required');

      return await getAdminService().deleteNavigation(documentId);
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
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'NavItem documentId is required');

      const { data } = ctx.request.body;
      return await getAdminService().updateNavItem(documentId, data);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async deleteNavItem (ctx) {
    try {
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'NavItem documentId is required');

      return await getAdminService().deleteNavItem(documentId);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async checkUniquePath (ctx) {
    try {
      const { path, targetRouteDocumentId } = ctx.query

      if (!path) return ctx.throw(400, 'Path is required')
      
      return await getAdminService().checkUniquePath(path, targetRouteDocumentId || null);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});

export default admin;