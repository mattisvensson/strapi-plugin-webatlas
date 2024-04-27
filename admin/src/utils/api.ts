import { request } from '@strapi/helper-plugin';
import { prop } from 'lodash/fp';
// import pluginId from '../pluginId';

// export const fetchNavigationConfig = () =>
//   request(`/${pluginId}/settings/config`, { method: 'GET' });

// export const updateNavigationConfig = ({ body }: { body: NavigationPluginConfig }) =>
//   request(`/${pluginId}/config`, { method: 'PUT', body: (body as unknown as XMLHttpRequestBodyInit) }, true);

// export const restoreNavigationConfig = () =>
//   request(`/${pluginId}/config`, { method: 'DELETE' }, true);

export const fetchAllContentTypes = async () =>
  request('/content-manager/content-types', { method: 'GET' }).then(prop("data"));

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