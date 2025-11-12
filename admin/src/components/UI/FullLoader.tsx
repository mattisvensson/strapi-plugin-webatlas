import { Loader, Box } from '@strapi/design-system';
import Center from './Center';

export default function FullLoader({ height }: { height?: number }) {
  return (
    <Center height={height}>
      <Loader>Loading...</Loader>
    </Center>
  );
}