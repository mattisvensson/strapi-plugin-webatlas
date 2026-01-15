import { useState, useEffect } from 'react';
import { PluginConfig } from '../../../types';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../../../utils';

type UsePluginConfigResponse = {
  config: PluginConfig | null;
  loading: boolean;
  fetchError: string | null;
  setConfig: (body: Partial<PluginConfig>) => Promise<void>;
};

export default function usePluginConfig(): UsePluginConfigResponse {
  const { put, get } = useFetchClient();

  const [config, setConfigData] = useState<PluginConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const { data: { data: contentTypesArray} } = await get('/content-manager/content-types');
        let { data: config } = await get(`/${PLUGIN_ID}/config`);

        if (!config || !config.selectedContentTypes) {
          throw new Error(`Couldn't fetch plugin config`);
        }

        const allowedContentTypes = contentTypesArray.filter((type: any) => 
          type.pluginOptions?.[PLUGIN_ID]?.active === true
        );

        const contentTypeUids = new Set(allowedContentTypes.map((type: any) => type.uid));
        const activeContentTypes = config.selectedContentTypes.filter((type: any) => contentTypeUids.has(type.uid));

        const displayConfig = { 
          ...config, 
          selectedContentTypes: activeContentTypes
        };

        setConfigData(displayConfig);
      } catch (error: any) {
        setFetchError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  async function setConfig(body: Partial<PluginConfig>): Promise<void> {
    try {
      await put(`/${PLUGIN_ID}/config`, { ...body });
    } catch (error) {
      throw error;
    }
  }

  return { config, loading, fetchError, setConfig };
}