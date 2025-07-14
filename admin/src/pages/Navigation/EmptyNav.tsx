import { EmptyDocuments } from '@strapi/icons/symbols';
import { Box, Typography } from '@strapi/design-system';

type EmptyNavProps = {
  msg: string;
}

export default function EmptyNav ({ msg }: EmptyNavProps) {

  return (
    <>
      <EmptyDocuments width="10rem" height="6rem"/>
      <Box padding={4}>
        <Typography variant="beta" textColor="neutral600">{msg}</Typography>
      </Box>
    </>
  )
}