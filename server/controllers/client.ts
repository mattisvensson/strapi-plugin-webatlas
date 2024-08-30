import { getClientService } from '../utils/pluginHelpers';

export default () => ({
  async getEntityByPath(ctx) {
    try {
      const { slug, populate, populateDeepDepth, fields } = ctx.query;

      if (!slug) return ctx.throw(400, 'Slug is required');

      const entity = await getClientService().getEntityByPath(slug, populate, populateDeepDepth, fields);

      if (!entity) return ctx.throw(404, 'Entity not found');

      return ctx.send(entity);
    } catch (e) {
      ctx.throw(500, e)
    }
  },
  async getNavigation (ctx) {
    try {
      const { id, name, variant } = ctx.query;

      if (!id && !name) return ctx.throw(400, 'Navigation id or name is required');

      const navigation = await getClientService().getNavigation(id, name, variant);

      if (!navigation) return ctx.throw(404, 'Navigation not found');

      return ctx.send(navigation);
    } catch (e) {
      return ctx.throw(500, e)
    }
  },
});
