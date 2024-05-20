import { Box, Typography, Divider, Button } from '@strapi/design-system';
import { Route, NavItem } from '../../types';
import { ModalContext } from '../../contexts';
import { useContext, useEffect } from 'react';
import { Trash } from '@strapi/icons';

type RouteItemProps = {
  item: Route;
  setParentId: (id: number) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NavItem | Route | undefined>>
}

export default function RouteItem({item, setParentId, setActionItem}: RouteItemProps) {

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }

  const handleAddChildren = () => {
    setParentId(item.id)
    setOpenModal('ItemCreate')
  }

  const handleDelete = () => {
    setActionItem(item)
    setOpenModal('ItemDelete')
  }

  return (
    <Box
      background='neutral0'
      borderColor="neutral150"
      hasRadius
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={6}
      shadow="tableShadow"
    >
      <Typography>{item.title} / Parent: {item.parent?.title}</Typography>
      <Divider/>
      <Button onClick={() => handleAddChildren()}>Add children</Button>
      <Button variant="danger-light" onClick={() => handleDelete()} startIcon={<Trash />}>Delete</Button>
    </Box>
  );
}
