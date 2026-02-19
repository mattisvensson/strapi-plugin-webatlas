import { Box, Typography, Flex, SimpleMenu, MenuItem, IconButton, Badge } from '@strapi/design-system';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { ModalContext } from '../../contexts';
import { useContext, ReactElement, forwardRef } from 'react';
import { Link as LinkIcon, ExternalLink, OneToMany, More, Drag } from '@strapi/icons';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export interface RouteItemProps {
  item: NestedNavItem;
  setParentNavItem: (item: NestedNavItem | null) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>;
  setNavigationItems: React.Dispatch<React.SetStateAction<NestedNavItem[] | undefined>>;
  ghost?: boolean;
  depth?: number;
  maxDepth: number;
  style?: React.CSSProperties;
  wrapperRef?(node: HTMLLIElement): void;
  handleProps?: any;
  disableInteraction?: boolean;
  indentationWidth?: number;
}


function RouteIcon ({ type, color = 'neutral800' }: { type: 'internal' | 'external' | 'wrapper' | undefined, color?: string }): ReactElement {
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
export const RouteItem = forwardRef<HTMLDivElement, RouteItemProps>(({
  item,
  setParentNavItem,
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
  const { formatMessage } = useIntl();

  const itemStatusOptions = {
    published: {
      status: formatMessage({
        id: getTranslation('published'),
        defaultMessage: 'Published',
      }),
      textColor: 'success600',
    },
    draft: {
      status: formatMessage({
        id: getTranslation('draft'),
        defaultMessage: 'Draft',
      }),
      textColor: 'secondary600',
    },
    modified: {
      status: formatMessage({
        id: getTranslation('modified'),
        defaultMessage: 'Modified',
      }),
      textColor: 'alternative600',
    }
  }

  const handleAddChildren = () => {
    setParentNavItem(item)
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
            <RouteIcon type={item.route.type}/>
            <Flex gap={2}>
              <Typography fontWeight="bold">{item.update?.title ? item.update.title : item.route.title}</Typography>
              <Typography textColor="neutral400">{item.route.type === 'internal' && '/'}{item.update?.path ? item.update.path : item.route.path}</Typography>
            </Flex>
            {item.isNew && !item.deleted &&
              <Badge backgroundColor="neutral100" textColor="success600">
                <Typography fontWeight="bold">
                  {formatMessage({
                    id: getTranslation('new'),
                    defaultMessage: 'New',
                  })}
                </Typography>
              </Badge>
            }
            {item.update && !item.deleted &&
              <Badge backgroundColor="neutral100" textColor="warning600">
                <Typography fontWeight="bold">
                  {formatMessage({
                    id: getTranslation('updated'),
                    defaultMessage: 'Updated',
                  })}
                </Typography>
              </Badge>
            }
            {item.deleted &&
              <Badge backgroundColor="neutral100" textColor="danger600">
                <Typography fontWeight="bold">
                  {formatMessage({
                    id: getTranslation('deleted'),
                    defaultMessage: 'Deleted',
                  })}
                </Typography>
              </Badge>
            }
          </Flex>
          <Flex direction="row" gap={4}>
            {item.route.type === 'internal' && item.status &&
              <Badge backgroundColor="neutral100" textColor={itemStatusOptions[item.status].textColor}>
                <Typography fontWeight="bold">
                  {itemStatusOptions[item.status].status}
                </Typography>
              </Badge>
            }
            <SimpleMenu label="Item actions" tag={IconButton} icon={<More />}>
            {!item.deleted && <>
              <MenuItem onClick={() => handleEdit()}>
                {formatMessage({
                  id: getTranslation('edit'),
                  defaultMessage: 'Edit',
                })}
              </MenuItem>
              {depth !== undefined && depth < maxDepth && <MenuItem onClick={() => handleAddChildren()}>
                {formatMessage({
                  id: getTranslation('navigation.page.navItem.addChildren'),
                  defaultMessage: 'Add children',
                })}
              </MenuItem>}
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
