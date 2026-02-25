import { Box, Typography, Flex } from '@strapi/design-system';
import { RouteItemProps } from '../../types';
import { ModalContext } from '../../contexts';
import { useContext, forwardRef } from 'react';
import { Drag } from '@strapi/icons';
import RouteItemMenu from './RouteItemMenu';
import RouteItemStatus from './RouteItemStatus';
import RouteItemIcon from './RouteItemIcon';
import RouteItemBadge from './RouteItemBadge';

export const RouteItem = forwardRef<HTMLDivElement, RouteItemProps>(({
  item,
  setActionItemParent,
  setActionItem,
  setNavigationItems,
  ghost,
  depth,
  maxDepth,
  style,
  wrapperRef,
  handleProps
}: RouteItemProps, ref) => {
  if (!item || !item.route) return null

  const { setModalType } = useContext(ModalContext);

  const handleAddChildren = () => {
    setActionItemParent(item)
    setModalType('ItemCreate')
  }

  const handleEdit = () => {
    setActionItem(item)

    let newModal = 'ItemEdit'
    if (item.route.type === 'external') newModal = 'ExternalEdit'
    if (item.route.type === 'wrapper') newModal = 'WrapperEdit'

    setModalType(newModal)
  }

  const handleDelete = () => {
    setActionItem(item)
    setModalType('ItemDelete')
  }

  const handleRestore = () => {
    setNavigationItems(navItems =>
      navItems?.map(navItem => {
        if (navItem.documentId === item.documentId) {
          delete navItem.update
          delete navItem.deleted
        }
        return navItem;
      })
    );
  }

  const elStyle = {
    marginLeft: depth !== undefined ? depth * 48 : 0,
    opacity: (ghost || item.deleted) ? 0.5 : 1,
    ...style,
  };

  return (
    <Box
      ref={wrapperRef}
      style={elStyle}
    >
      <Box
        background={item.route?.active ? 'neutral0' : 'neutral100'}
        borderColor="neutral150"
        hasRadius
        paddingBottom={4}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        shadow="tableShadow"
        ref={ref}
      >
        <Flex justifyContent="space-between" gap={4}>
          <Flex gap={4}>
            <Drag color="neutral800" {...handleProps}/>
            <Box
              width="1px"
              height="32px"
              background="neutral150"
            />
            <RouteItemIcon type={item.route.type}/>
            <Flex gap={2}>
              <Typography fontWeight="bold">{item.update?.title ? item.update.title : item.route.title}</Typography>
              <Typography textColor="neutral400">{item.route.type === 'internal' && '/'}{item.update?.path ? item.update.path : item.route.path}</Typography>
            </Flex>
            <RouteItemStatus item={item} />
          </Flex>
          <Flex direction="row" gap={4}>
            <RouteItemBadge item={item} />
            <RouteItemMenu
              item={item}
              depth={depth}
              maxDepth={maxDepth}
              handleEdit={handleEdit}
              handleAddChildren={handleAddChildren}
              handleDelete={handleDelete}
              handleRestore={handleRestore}
            />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
})
