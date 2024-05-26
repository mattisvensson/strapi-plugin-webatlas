import { useState, useEffect } from 'react';
import { PluginConfig } from '../../../types';
import { useFetchClient } from '@strapi/helper-plugin';

type UsePluginConfigResponse = {
  data: PluginConfig | null;
  loading: boolean;
  error: string | null;
  setConfig: (body: PluginConfig) => Promise<boolean | void>;
};

export default function usePluginConfig(): UsePluginConfigResponse {
  const { put } = useFetchClient();

  const [data, setData] = useState<PluginConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/url-routes/config');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setData(data);
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
      await put('/url-routes/config', {
        ...body,
      });      
    } catch (error) {
      setError((error as Error).message);
    }
  }

  return { data, loading, error, setConfig };
}