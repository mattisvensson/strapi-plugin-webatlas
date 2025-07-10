import { Plus } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { Flex, Box, Typography, Button } from '@strapi/design-system';
import { NavCreate } from '../../components/modals';

type EmptyNavProps = {
  msg: string;
  modal: string,
}

export default function EmptyNav ({ msg, modal }: EmptyNavProps) {

  return (
    <>
      <EmptyDocuments width="10rem" height="6rem"/>
      <Box padding={4}>
        <Typography variant="beta" textColor="neutral600">{msg}</Typography>
      </Box>
    </>
  )
}