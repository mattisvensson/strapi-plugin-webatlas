import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { NestedNavigation } from '../../../types';
import { PLUGIN_ID } from '../../../utils';

export default function useNavigations () {
  const { get } = useFetchClient();
  const [navigations, setNavigations] = useState<NestedNavigation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const fetchNavigations = async () => {
    setLoading(true);

    try {
      const { data } = await get(`/${PLUGIN_ID}/navigation`);
      setNavigations(data || []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch navigations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigations();
  }, []);

  return { navigations, fetchNavigations, loading, fetchError };
};