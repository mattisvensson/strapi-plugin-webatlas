import { ContentType, GroupedEntities, RouteSettings, ConfigContentType, StructuredNavigationVariant, NavigationInput, NestedNavItem } from '../../../types';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../../../utils';

export default function useApi() {
  const { get, put, del } = useFetchClient();

  const fetchAllContentTypes = async () => {
    const { data } = await get('/content-manager/content-types');
    return data.data
  }

  const fetchAllEntities = async (contentTypes?: ConfigContentType[]) => {
    try {
      if (!contentTypes) {
        const { data } = await get(`/${PLUGIN_ID}/config`)
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

  const getRelatedRoute = async (relatedDocumentId: string) => {
    const { data } = await get(`/${PLUGIN_ID}/route/related?documentId=${relatedDocumentId}`);
    return data
    
  };

  const getRoutes = async () => {
    const { data } = await get(`/${PLUGIN_ID}/route`);
    return data
  };
  
  const updateRoute = async (body: RouteSettings, documentId: string) => {
    const { data } = await put(`/${PLUGIN_ID}/route?documentId=${documentId}`, {
      data: {
        ...body,
      },
    });
    return data
  };

  const getStructuredNavigation = async (documentId: string, variant: StructuredNavigationVariant = 'nested') => {
    const { data } = await get(`/${PLUGIN_ID}/navigation?documentId=${documentId}&variant=${variant}`);
    return data
  }

  const getNavigation = async ({ documentId, variant }: {documentId?: string, variant?: StructuredNavigationVariant | "namesOnly"} = {}) => {
    const query = [];
    if (documentId) query.push(`documentId=${documentId}`);
    if (variant) query.push(`variant=${variant}`);
    const { data } = await get(`/${PLUGIN_ID}/navigation${query.length > 0 ? `?${query.join('&')}` : ''}`);
    return data
  }

  const deleteNavigation = async (documentId: string) => {
    const { data } = await del(`/${PLUGIN_ID}/navigation?documentId=${documentId}`);
    return data
  }

  const updateNavigation = async (documentId: string, body: NavigationInput) => {
    const { data } = await put(`/${PLUGIN_ID}/navigation?documentId=${documentId}`, {
      data: body,
    });
    return data
  };

  const updateNavigationItemStructure = async (documentId: string, navigationItems: NestedNavItem[]) => {
    const { data } = await put(`/${PLUGIN_ID}/navigation/items`, {
      navigationId: documentId,
      navigationItems,
    });
    return data
  };

  return { 
    fetchAllContentTypes,
    fetchAllEntities,
    getRelatedRoute,
    getRoutes,
    updateRoute,
    getStructuredNavigation,
    getNavigation,
    deleteNavigation,
    updateNavigation,
    updateNavigationItemStructure,
  }
}
