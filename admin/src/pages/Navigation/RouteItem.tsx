import { Box, Typography, Flex, SimpleMenu, MenuItem, IconButton, Status } from '@strapi/design-system';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { ModalContext } from '../../contexts';
import { useContext, useEffect, useState, ReactElement, forwardRef } from 'react';
import { Link as LinkIcon, ExternalLink, OneToMany, More, Drag } from '@strapi/icons';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export interface RouteItemProps {
  item: NestedNavItem;
  setParentId: (id: string) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>;
  setNavigationItems: React.Dispatch<React.SetStateAction<NestedNavItem[] | undefined>>;
  ghost?: boolean;
  depth?: number;
  style?: React.CSSProperties;
  wrapperRef?(node: HTMLLIElement): void;
  handleProps?: any;
  disableInteraction?: boolean;
  indentationWidth?: number;
}

type RouteType = "internal" | "external" | "wrapper"

function RouteIcon ({ type, color = 'neutral800' }: { type: RouteType | undefined, color?: string }): ReactElement {
  switch (type) {
    case "external":
      return <ExternalLink color={color}/>
    case "wrapper":
      return <OneToMany color={color}/>
    case "internal":
      return <LinkIcon color={color}/>
    default:
      return <Box width="16px" height="16px"/>
  }
}
export const RouteItem = forwardRef<HTMLDivElement, RouteItemProps>(({item, setParentId, setActionItem, setNavigationItems, ghost, depth, style, wrapperRef, handleProps}: RouteItemProps, ref) => {
  if (!item || !item.route) return null

  const { setModalType } = useContext(ModalContext);
  const { formatMessage } = useIntl();

  const itemStatusOptions = {
    published: {
      status: formatMessage({
        id: getTranslation('published'),
        defaultMessage: 'Published',
      }),
      variant: 'primary',
    },
    draft: {
      status: formatMessage({
        id: getTranslation('draft'),
        defaultMessage: 'Draft',
      }),
      variant: 'secondary',
    },
    modified: {
      status: formatMessage({
        id: getTranslation('modified'),
        defaultMessage: 'Modified',
      }),
      variant: 'alternative',
    }
  }

  const [type, setType] = useState<RouteType>()
  useEffect(() => {
    if (!item.route.internal && !item.route.wrapper) {
      setType("external")
    } else if (item.route.wrapper) {
      setType("wrapper")
    } else {
      setType("internal")
    }
  }, [item])

  const handleAddChildren = () => {
    setParentId(item.documentId)
    setModalType('ItemCreate')
  }

  const handleEdit = () => {
    setActionItem(item)

    let newModal = 'ItemEdit'
    if (!item.route.internal) newModal = 'ExternalEdit'
    if (item.route.wrapper) newModal = 'WrapperEdit'
    
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
            <RouteIcon type={type}/>
            <Flex gap={2}>
              <Typography fontWeight="bold">{item.update?.title ? item.update.title : item.route.title}</Typography>
              <Typography textColor="neutral400">{type === 'internal' && '/'}{item.update?.fullPath ? item.update.fullPath : item.route.fullPath}</Typography>
            </Flex>
            {item.isNew && !item.deleted &&
              <Status variant="alternative" size="S">
                <Typography fontWeight="bold">
                  {formatMessage({
                    id: getTranslation('new'),
                    defaultMessage: 'New',
                  })}
                </Typography>
              </Status>
            }
            {item.update && !item.deleted &&
              <Status variant="alternative" size="S">
                <Typography fontWeight="bold">
                  {formatMessage({
                    id: getTranslation('updated'),
                    defaultMessage: 'Updated',
                  })}
                </Typography>
              </Status>
            }
            {item.deleted &&
              <Status size="S">
                <Typography fontWeight="bold" textColor="danger500">
                  {formatMessage({
                    id: getTranslation('deleted'),
                    defaultMessage: 'Deleted',
                  })}
                </Typography>
              </Status>
            }
          </Flex>
          <Flex direction="row" gap={4}>
            {type === 'internal' && item.status &&
              <Status variant={itemStatusOptions[item.status].variant} size="S">
                <Typography fontWeight="bold">
                  {itemStatusOptions[item.status].status}
                </Typography>
              </Status>
            }
            <SimpleMenu label="Item actions" tag={IconButton} icon={<More />}>
            {!item.deleted && <>
              <MenuItem onClick={() => handleEdit()}>
                {formatMessage({
                  id: getTranslation('edit'),
                  defaultMessage: 'Edit',
                })}
              </MenuItem>
              <MenuItem onClick={() => handleAddChildren()}>
                {formatMessage({
                  id: getTranslation('navigation.page.navItem.addChildren'),
                  defaultMessage: 'Add children',
                })}
              </MenuItem>
              <MenuItem onClick={() => handleDelete()}>
                <Typography textColor="danger600">
                  {formatMessage({
                    id: getTranslation('delete'),
                    defaultMessage: 'Delete',
                  })}
                </Typography>
              </MenuItem>
            </>}
            {(item.deleted || item.update) && <>
              <MenuItem onClick={() => handleRestore()}>
                {formatMessage({
                  id: getTranslation('restore'),
                  defaultMessage: 'Restore',
                })}
              </MenuItem>
            </>}
            </SimpleMenu>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
})