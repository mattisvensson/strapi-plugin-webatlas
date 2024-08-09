import { Box, Typography, Divider, Button, Flex } from '@strapi/design-system';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { ModalContext } from '../../contexts';
import { useContext } from 'react';
import { Trash } from '@strapi/icons';

type RouteItemProps = {
  item: NestedNavItem;
  setParentId: (id: number) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>;
  hasParent?: boolean;
}

export default function RouteItem({item, setParentId, setActionItem, hasParent}: RouteItemProps) {
  const { setModal } = useContext(ModalContext);

  const handleAddChildren = () => {
    setParentId(item.id)
    setModal('ItemCreate')
  }

  const handleEdit = () => {
    setActionItem(item)

    let newModal = 'ItemEdit'
    if (!item.route.internal) newModal = 'ExternalEdit'
    if (item.route.wrapper) newModal = 'WrapperEdit'
    
    setModal(newModal)
  }

  const handleDelete = () => {
    setActionItem(item)
    setModal('ItemDelete')
  }

  return (
    <Flex direction="column" alignItems="stretch" gap={4} marginLeft={hasParent ? 4 : 0}>
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
        <Typography>{item.route?.title} - {item.route?.fullPath}</Typography>
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
        <RouteItem key={index} item={childItem} setParentId={setParentId} setActionItem={setActionItem} hasParent/>  
      ))}
    </Flex>
  );
}
