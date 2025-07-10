import { Flex } from '@strapi/design-system';

export default function Center({ height = 400, children }: { height?: number, children: React.ReactNode }) {

  return (
    <Flex direction="column" minHeight={`${height}px`} justifyContent="center">
      {children}
    </Flex>
  )
}