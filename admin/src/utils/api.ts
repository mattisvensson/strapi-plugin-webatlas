import { request } from '@strapi/helper-plugin';
import { prop } from 'lodash/fp';
import { ContentType } from '../types';
// import pluginId from '../pluginId';

// export const fetchNavigationConfig = () =>
//   request(`/${pluginId}/settings/config`, { method: 'GET' });

// export const updateNavigationConfig = ({ body }: { body: NavigationPluginConfig }) =>
//   request(`/${pluginId}/config`, { method: 'PUT', body: (body as unknown as XMLHttpRequestBodyInit) }, true);

// export const restoreNavigationConfig = () =>
//   request(`/${pluginId}/config`, { method: 'DELETE' }, true);

export const fetchAllContentTypes = async () =>
  request('/content-manager/content-types', { method: 'GET' }).then(prop("data"));

export const fetchAllEntities = async (contentTypes?: string[]) => {
  try {
    if (!contentTypes) {
      const config = await request('/url-routes/config')
      contentTypes = config?.selectedContentTypes || []
    }
  
    const allContentTypes = await fetchAllContentTypes();
  
    let entities: { label: string, entities: ContentType}[] = [];
    if (contentTypes && contentTypes.length > 0) {
      entities = await Promise.all(
        contentTypes.map(async (contentType: string) => {
          const { results } = await request(`/content-manager/collection-types/${contentType}`);
          const entity = allContentTypes.find((ct: ContentType) => ct.uid === contentType);
          if (!entity) {
            throw new Error(`Content type ${contentType} not found`);
          }
          return {
            entities: results,
            label: entity.info.displayName,
          }
        })
      );
    }
    return entities;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// export const restartStrapi = () =>
//   request(`/${pluginId}/settings/restart`);

export const createUrlAlias = async (body: { id: number }, slug: string) => {
  return request('/url-routes/route', {
    method: 'POST',
    body: {
      data: {
        ...body,
        contentType: slug,
      },
    },
  });
};

export const updateUrlAlias = async (body: { id: number }, slug: string) => {
  return request(`/url-routes/route/${body.id}`, {
    method: 'PUT',
    body: {
      data: body,
      contentType: slug,
    },
  });
};