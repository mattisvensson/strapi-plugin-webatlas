import { Plus, EmptyDocuments } from '@strapi/icons';
import { Flex, Box, Typography, Button } from '@strapi/design-system';
import { useContext } from 'react';
import { ModalContext } from '../../contexts';

type EmptyNavProps = {
  msg: string;
  buttonText: string,
  modal: string,
}

export default function EmptyNav ({ msg, buttonText, modal }: EmptyNavProps) {

  const { setModal } = useContext(ModalContext);

  return (
    <Flex direction="column" minHeight="400px" justifyContent="center">
      <EmptyDocuments width="10rem" height="6rem"/>
      <Box padding={4}>
        <Typography variant="beta" textColor="neutral600">{msg}</Typography>
      </Box>
      <Button
        variant='secondary'
        startIcon={<Plus/>}
        label="Label"
        onClick={() => setModal(modal)}
      >
        {buttonText}
      </Button>
    </Flex>
  )
}