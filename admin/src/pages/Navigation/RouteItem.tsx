import { Box, Typography, Divider, Button, Flex } from '@strapi/design-system';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { ModalContext } from '../../contexts';
import { useContext, useRef } from 'react';
import { Trash } from '@strapi/icons';

type RouteItemProps = {
  item: NestedNavItem;
  setParentId: (id: number) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>;
  parentPath?: string;
}

export default function RouteItem({item, setParentId, setActionItem, parentPath}: RouteItemProps) {
  const fullPath = useRef<string>(parentPath ? `${parentPath}/${item.route.path}` : item.route.path);

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }

  const handleAddChildren = () => {
    setParentId(item.id)
    setOpenModal('ItemCreate')
  }

  const handleEdit = () => {
    setActionItem(item)
    setOpenModal('ItemEdit')
  }

  const handleDelete = () => {
    setActionItem(item)
    setOpenModal('ItemDelete')
  }

  return (
    <Flex direction="column" alignItems="stretch" gap={4} marginLeft={parentPath ? 4 : 0}>
      <Box
        background='neutral0'
        borderColor="neutral150"
        hasRadius
        paddingBottom={4}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        shadow="tableShadow"
      >
        <Typography>{item.route?.title} - {fullPath.current}</Typography>
        <Box paddingBottom={2} paddingTop={2}>
          <Divider/>
        </Box>
        <Flex direction="row" gap={4}>
          <Button onClick={() => handleEdit()}>Edit</Button>
          <Button onClick={() => handleAddChildren()}>Add children</Button>
          <Button variant="danger-light" onClick={() => handleDelete()} startIcon={<Trash />}>Delete</Button>
        </Flex>
      </Box>
      {item.items.map((childItem: NestedNavItem, index) => (
        <RouteItem key={index} item={childItem} setParentId={setParentId} setActionItem={setActionItem} parentPath={fullPath.current}/>  
      ))}
    </Flex>
  );
}
