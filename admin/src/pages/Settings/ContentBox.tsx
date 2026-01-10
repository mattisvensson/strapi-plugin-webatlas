import { Typography, Flex, Box } from '@strapi/design-system';

export default function ContentBox({ title, children }: { title: string, children: React.ReactNode }) {
  return <Flex
    background='neutral0'
    hasRadius
    paddingTop={6}
    paddingBottom={6}
    paddingLeft={7}
    paddingRight={7}
    shadow="tableShadow"
    direction="column"
    alignItems="stretch"
    gap={4}
  >
    <Typography variant="delta" as="h3">
      {title}
    </Typography>
    <Box>
      {children}
    </Box>
  </Flex>
}