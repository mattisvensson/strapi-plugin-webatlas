import { useState, useEffect } from 'react';
import { useFetchClient } from '@strapi/helper-plugin';
import { NavItem } from '../types';

export default function useNavigations () {
  const { get } = useFetchClient();
  const [navigations, setNavigations] = useState<NavItem[]>([]);

  const fetchNavigations = async () => {
    const { data } = await get('/content-manager/collection-types/plugin::url-routes.navigation');
    setNavigations(data.results);
  };

  useEffect(() => {
    fetchNavigations();
  }, []);

  return [navigations, fetchNavigations];
};