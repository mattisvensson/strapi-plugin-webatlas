import { ContentType, GroupedEntities, RouteSettings } from '../types';
import { useFetchClient } from '@strapi/helper-plugin';

export default function useApi() {
  const { get, post, put } = useFetchClient();

  const fetchAllContentTypes = async () => {
    const { data } = await get('/content-manager/content-types');
    return data.data
  }

  const fetchAllEntities = async (contentTypes?: string[]) => {
    try {
      if (!contentTypes) {
        const { data } = await get('/url-routes/config')
        contentTypes = data?.selectedContentTypes || []
      }

      const allContentTypes = await fetchAllContentTypes();

      let entities: GroupedEntities[] = [];
      if (contentTypes && contentTypes.length > 0) {
        entities = await Promise.all(
          contentTypes.map(async (contentType: string) => {
            const { data } = await get(`/content-manager/collection-types/${contentType}`);
            const entity = allContentTypes.find((ct: ContentType) => ct.uid === contentType);
            if (!entity) {
              throw new Error(`Content type ${contentType} not found`);
            }
            return {
              entities: data.results,
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

  const getRouteByRelated = async (relatedId: number, populate?: string) => {
    const { data } = await get(`/content-manager/collection-types/plugin::url-routes.route?filters[relatedId][$eq]=${relatedId}${populate ? '&populate' + populate : ''}`);
    return data;
  };

  const createRoute = async (body: RouteSettings) => {
    const { data } = await post('/url-routes/route', {
      data: {
        ...body,
      },
    });
    return data
  };

  const updateRoute = async (body: RouteSettings, id: number) => {
    const { data } = await put(`/url-routes/route/${id}`, {
      data: {
        ...body,
      },
    });
    return data
  };

  return { fetchAllContentTypes, fetchAllEntities, getRouteByRelated, createRoute, updateRoute}
}
