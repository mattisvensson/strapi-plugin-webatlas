import { ContentType, GroupedEntities, RouteSettings, NavItemSettings, ConfigContentType, NavOverviewState } from '../../../types';
import { useFetchClient } from '@strapi/helper-plugin';

export default function useApi() {
  const { get, post, put } = useFetchClient();

  const fetchAllContentTypes = async () => {
    const { data } = await get('/content-manager/content-types');
    return data.data
  }

  const fetchAllEntities = async (contentTypes?: ConfigContentType[]) => {
    try {
      if (!contentTypes) {
        const { data } = await get('/url-routes/config')
        contentTypes = data?.selectedContentTypes || []
      }

      const allContentTypes = await fetchAllContentTypes();

      let entities: GroupedEntities[] = [];
      if (contentTypes && contentTypes.length > 0) {
        entities = await Promise.all(
          contentTypes.map(async (contentType: ConfigContentType) => {
            const { data } = await get(`/content-manager/collection-types/${contentType.uid}`);
            const entity = allContentTypes.find((ct: ContentType) => ct.uid === contentType.uid);
            if (!entity) {
              throw new Error(`Content type ${contentType} not found`);
            }
            return {
              entities: data.results,
              label: entity.info.displayName,
              contentType
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

  const getRouteByRelated = async (relatedCt: string, relatedId: number, populate?: string) => {
    const { data } = await get(`/content-manager/collection-types/plugin::url-routes.route?filters[relatedId][$eq]=${relatedId}&filters[relatedContentType][$eq]=${relatedCt}${populate ? '&populate' + populate : ''}`);
    return data;
  };

  const createExternalRoute = async (body: RouteSettings) => {
    const { data } = await post('/url-routes/route/external', {
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

  const createNavItem = async (body: NavItemSettings) => {
    const { data } = await post('/url-routes/navitem', {
      data: {
        ...body,
      },
    });
    return data
  };

  const updateNavItem = async (body: NavItemSettings, id: number) => {
    const { data } = await put(`/url-routes/navitem/${id}`, {
      data: {
        ...body,
      },
    });
    return data
  };

  const getNestedNavigation = async (id: number) => {
    const { data } = await get(`/url-routes/navigation/${id}/nested`);
    return data
  }

  return { fetchAllContentTypes, fetchAllEntities, getRouteByRelated, createExternalRoute, updateRoute, createNavItem, updateNavItem, getNestedNavigation}
}
