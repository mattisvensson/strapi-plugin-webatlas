import { useState, useEffect } from 'react';
import useApi from './useApi';
import { GroupedEntities } from '../types';

const useAllContentTypes = () => {
  const { fetchAllContentTypes } = useApi();
  const [contentTypes, setContentTypes] = useState<GroupedEntities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const result = await fetchAllContentTypes();

        setContentTypes(result);
        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchEntities();
  }, []);
  return { contentTypes, loading, error };
};

export default useAllContentTypes;

