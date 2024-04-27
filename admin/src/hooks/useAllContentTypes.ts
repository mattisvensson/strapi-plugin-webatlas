//@ts-ignore
import { useQuery } from 'react-query';
import { pick } from 'lodash';
import { fetchAllContentTypes } from '../utils/api';

const useAllContentTypes = () => pick(
  useQuery('contentTypes', () => fetchAllContentTypes()),
  ["data", "isLoading", "error"]
);

export default useAllContentTypes;