import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { NestedNavigation } from '../../../types';

export default function useNavigations () {
  const { get } = useFetchClient();
  const [navigations, setNavigations] = useState<NestedNavigation[]>([]);
  
  const fetchNavigations = async () => {
    const { data } = await get('/webatlas/navigation');
    setNavigations(data || []);
  };

  useEffect(() => {
    fetchNavigations();
  }, []);

  return { navigations, fetchNavigations };
};