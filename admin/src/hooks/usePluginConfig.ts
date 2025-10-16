import { useState, useEffect } from 'react';
import { PluginConfig } from '../../../types';
import { useFetchClient } from '@strapi/strapi/admin';

type UsePluginConfigResponse = {
  data: PluginConfig | null;
  loading: boolean;
  error: string | null;
  setConfig: (body: PluginConfig) => Promise<boolean | void>;
};

export default function usePluginConfig(): UsePluginConfigResponse {
  const { put, get } = useFetchClient();

  const [data, setData] = useState<PluginConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { data: contentTypesArray} } = await get('/content-manager/content-types');
        let { data: config } = await get('/webatlas/config');

        if (!config || !config.selectedContentTypes) {
          throw new Error(`HTTP error! Couldn't fetch plugin config`);
        }

        // Only use content types that have webatlas enabled in plugin options
        const allowedContentTypes = contentTypesArray.filter((type: any) => 
          type.pluginOptions?.webatlas?.active === true
        );

        const contentTypeUids = new Set(allowedContentTypes.map((type: any) => type.uid));
        const activeContentTypes = config.selectedContentTypes.filter((type: any) => contentTypeUids.has(type.uid));

        if (JSON.stringify(activeContentTypes) !== JSON.stringify(config.selectedContentTypes)) {
          config = { ...config, selectedContentTypes: activeContentTypes}
          setConfig(config);
        }

        setData(config);
        setLoading(false);
      } catch (error) {
        setError((error as Error).message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  async function setConfig(body: PluginConfig) {
    try {
      await put('/webatlas/config', {
        ...body,
      });      
    } catch (error) {
      setError((error as Error).message);
    }
  }

  return { data, loading, error, setConfig };
}