import { ContentType, GroupedEntities, RouteSettings, ConfigContentType, StructuredNavigationVariant, NavigationInput, NestedNavItem } from '../../../types';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../../../utils';

export default function useApi() {
  const { get, put, del, post } = useFetchClient();

  const fetchAllContentTypes = async () => {
    try {
      const { data } = await get('/content-manager/content-types');
      return data.data;
    } catch (error) {
      console.warn('Cannot fetch all content types:', error);
      return [];
    }
  }

  const fetchConfiguredContentTypes = async () => {
    try {
      const { data: config } = await get(`/${PLUGIN_ID}/config`);
      const configuredTypes = config?.selectedContentTypes || [];
      
      if (configuredTypes.length === 0) {
        return [];
      }

      const allContentTypes = await fetchAllContentTypes();
      const configuredUIDs = new Set(configuredTypes.map((ct: ConfigContentType) => ct.uid));
      
      return allContentTypes.filter((ct: ContentType) => configuredUIDs.has(ct.uid));
    } catch (err) {
      console.error('Error fetching configured content types:', err);
      return [];
    }
  }

  const fetchAllEntities = async (): Promise<GroupedEntities[]> => {
    try {
      
      const { data } = await get(`/${PLUGIN_ID}/config`)
      const contentTypes = data?.selectedContentTypes || []
      

      if (!contentTypes || contentTypes.length === 0) {
        return [];
      }

      let entities: GroupedEntities[] = [];

      const entityResults = await Promise.allSettled(
        contentTypes.map(async (contentType: ConfigContentType) => {
          try {
            const { data } = await get(`/content-manager/collection-types/${contentType.uid}?pageSize=9999`);
 
            if (!data || !data.results) {
              return null;
            }
            
            return {
              entities: data.results,
              contentType
            };
          } catch (err) {
            console.warn(`Cannot access entities for ${contentType.uid}:`, err);
            return null;
          }
        })
      );

      entities = entityResults
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter(Boolean) as GroupedEntities[];

      return entities;
    } catch (err) {
      console.error('Error fetching entities:', err);
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

  const getNavigation = async ({ documentId, variant }: {documentId?: string, variant?: StructuredNavigationVariant | "namesOnly"} = {}) => {
    const query = [];
    if (documentId) query.push(`documentId=${documentId}`);
    if (variant) query.push(`variant=${variant}`);
    const { data } = await get(`/${PLUGIN_ID}/navigation${query.length > 0 ? `?${query.join('&')}` : ''}`);
    return data
  }

  const createNavigation = async (body: NavigationInput) => {
    const { data } = await post(`/${PLUGIN_ID}/navigation`, {
      data: body,
    });
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
    fetchConfiguredContentTypes,
    fetchAllEntities,
    getRelatedRoute,
    getRoutes,
    updateRoute,
    getNavigation,
    createNavigation,
    deleteNavigation,
    updateNavigation,
    updateNavigationItemStructure,
  }
}
