import { useQuery } from 'react-query';
import { pick } from 'lodash';
import { fetchAllEntities } from '../utils/api';

const useAllEntities = () => pick(
  useQuery('allEntities', () => fetchAllEntities()),
  ["data", "isLoading", "error"]
);

export default useAllEntities;