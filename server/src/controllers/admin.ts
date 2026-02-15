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
  async getRoute(ctx) {
    try {
      const { documentId } = ctx.params;

      if (!documentId) return ctx.throw(400, 'Route documentId is required');

      return await getAdminService().getRoute(documentId);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getAllRoutes(ctx) {
    try {
      return await getAdminService().getAllRoutes();
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
  async getRelatedRoute (ctx) {
    try {
      const { documentId } = ctx.query;

      if (!documentId) return ctx.throw(400, 'Route documentId is required');

      return await getAdminService().getRelatedRoute(documentId);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
  async getRouteHierarchy (ctx) {
    try {
      const { documentId } = ctx.params;

      if (!documentId) return ctx.throw(400, 'Route documentId is required');

      return await getAdminService().getRouteHierarchy(documentId);
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
      const { data } = ctx.request.body;
      
      if (!data || !data.name) return ctx.throw(400, 'Navigation name is required');
      
      return await getAdminService().createNavigation(data.name, data.visible);
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
  async updateNavigationItemStructure (ctx) {
    try {
      const { navigationId, navigationItems } = ctx.request.body;

      if (!navigationId || !navigationItems) return ctx.throw(400, 'NavigationId and Navigation items are required');

      return await getAdminService().updateNavigationItemStructure(navigationId, navigationItems);
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
  async checkUniquePath (ctx) {
    try {
      const { path, targetRouteDocumentId } = ctx.query

      if (!path) return ctx.throw(400, 'Path is required')
      
      const res = await getAdminService().checkUniquePath(path, targetRouteDocumentId || null);
      return ctx.send({ uniquePath: res });
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});

export default admin;