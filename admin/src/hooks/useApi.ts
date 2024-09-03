import { ContentType, GroupedEntities, RouteSettings, NavItemSettings, ConfigContentType, NavOverviewState, StructuredNavigationVariant } from '../../../types';
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
        const { data } = await get('/webatlas/config')
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
    const { data } = await get(`/content-manager/collection-types/plugin::webatlas.route?filters[relatedId][$eq]=${relatedId}&filters[relatedContentType][$eq]=${relatedCt}${populate ? '&populate' + populate : ''}`);
    
    if (data?.results) return data.results[0];
    
    return null;
  };

  const createExternalRoute = async (body: RouteSettings) => {
    const { data } = await post('/webatlas/route/external', {
      data: {
        ...body,
      },
    });
    return data
  };

  const updateRoute = async (body: RouteSettings, id: number) => {
    const { data } = await put(`/webatlas/route/${id}`, {
      data: {
        ...body,
      },
    });
    return data
  };

  const createNavItem = async (body: NavItemSettings) => {
    const { data } = await post('/webatlas/navitem', {
      data: {
        ...body,
      },
    });
    return data
  };

  const updateNavItem = async (body: NavItemSettings, id: number) => {
    const { data } = await put(`/webatlas/navitem/${id}`, {
      data: {
        ...body,
      },
    });
    return data
  };

  const getStructuredNavigation = async (id: number, variant: StructuredNavigationVariant) => {
    const { data } = await get(`/webatlas/navigation/${id}/structured?variant=${variant}`);
    return data
  }

  return { fetchAllContentTypes, fetchAllEntities, getRouteByRelated, createExternalRoute, updateRoute, createNavItem, updateNavItem, getStructuredNavigation }
}
