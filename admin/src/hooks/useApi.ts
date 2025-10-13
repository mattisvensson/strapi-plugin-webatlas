import { ContentType, GroupedEntities, RouteSettings, NavItemSettings, ConfigContentType, NavOverviewState, StructuredNavigationVariant, NavigationInput } from '../../../types';
import { useFetchClient } from '@strapi/strapi/admin';

export default function useApi() {
  const { get, post, put, del } = useFetchClient();

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

  const getRouteByRelated = async (relatedDocumentId: string, populate?: string) => {
    const { data } = await get(`/content-manager/collection-types/plugin::webatlas.route?filters[relatedDocumentId][$eq]=${relatedDocumentId}${populate ? '&populate' + populate : ''}`);
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

  const getRoutes = async () => {
    const { data } = await get('/webatlas/route');
    return data
  };
  
  const updateRoute = async (body: RouteSettings, documentId: string) => {
    const { data } = await put(`/webatlas/route?documentId=${documentId}`, {
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

  const updateNavItem = async (documentId: string, body: NavItemSettings) => {
    const { data } = await put(`/webatlas/navitem?documentId=${documentId}`, {
      data: {
        ...body,
      },
    });
    return data
  };

  const deleteNavItem = async (documentId: string) => {
    const { data } = await del(`/webatlas/navitem?documentId=${documentId}`);
    return data
  };

  const getStructuredNavigation = async (documentId: string, variant: StructuredNavigationVariant = 'nested') => {
    const { data } = await get(`/webatlas/navigation?documentId=${documentId}&variant=${variant}`);
    return data
  }

  const deleteNavigation = async (documentId: string) => {
    const { data } = await del(`/webatlas/navigation?documentId=${documentId}`);
    return data
  }

  const updateNavigation = async (documentId: string, body: NavigationInput) => {
    const { data } = await put(`/webatlas/navigation?documentId=${documentId}`, {
      data: body,
    });
    return data
  };

  return { fetchAllContentTypes, fetchAllEntities, getRouteByRelated, createExternalRoute, getRoutes, updateRoute, createNavItem, updateNavItem, deleteNavItem, getStructuredNavigation, deleteNavigation, updateNavigation }
}
