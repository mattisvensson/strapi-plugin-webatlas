import { useState, useEffect } from 'react';
import useApi from './useApi';
import { GroupedEntities } from '../../../types';

const useAllEntities = () => {
  const { fetchAllEntities } = useApi();
  const [entities, setEntities] = useState<GroupedEntities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const result = await fetchAllEntities();

        setEntities(result);
        setLoading(false);
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchEntities();
  }, []);
  return { entities, loading, error };
};

export default useAllEntities;
