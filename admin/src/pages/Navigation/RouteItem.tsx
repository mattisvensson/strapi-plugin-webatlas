import { Box, Typography, Flex, MenuItem, IconButton, Icon, Status, Popover } from '@strapi/design-system';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { ModalContext } from '../../contexts';
import { useContext, useEffect, useState, ReactElement, useRef, forwardRef } from 'react';
import { Link as LinkIcon, ExternalLink, OneToMany, More, Drag, ChevronDown } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';
import { countChildren } from '../../utils';

export interface RouteItemProps {
  item: NestedNavItem;
  setParentId: (id: number) => void;
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>;
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
      return <Icon as={ExternalLink} color={color}/>
    case "wrapper":
      return <Icon as={OneToMany} color={color}/>
    case "internal":
      return <Icon as={LinkIcon} color={color}/>
    default:
      return <Box width="16px" height="16px"/>
  }
}
export const RouteItem = forwardRef<HTMLDivElement, RouteItemProps>(({item, setParentId, setActionItem, ghost, depth, style, wrapperRef, handleProps}: RouteItemProps, ref) => {
  const { setModal } = useContext(ModalContext);
  const { get } = useFetchClient();

  const [isPublished, setIsPublished] = useState(false)
  const [type, setType] = useState<RouteType>()
  const [isVisible, setIsVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const actionButtonRef = useRef<HTMLButtonElement>();

  if (!item) return null

  useEffect(() => {
    if (!item.route.internal && !item.route.wrapper) {
      setType("external")
    } else if (item.route.wrapper) {
      setType("wrapper")
    } else {
      setType("internal")
    }
  }, [item])

  useEffect(() => {
    const ct = item.route.relatedContentType
    const id = item.route.relatedId

    if (!ct || !id) return

    async function fetchRelated() {
      try {
        const { data } = await get(`/content-manager/collection-types/${ct}/${id}`)
        if (data.publishedAt) setIsPublished(true)
      } catch (err) {
        console.log(err)
      }
    }
    fetchRelated()
  }, [])


  const handleAddChildren = () => {
    setIsVisible(false)
    setParentId(item.id)
    setModal('ItemCreate')
  }

  const handleEdit = () => {
    setIsVisible(false)
    setActionItem(item)

    let newModal = 'ItemEdit'
    if (!item.route.internal) newModal = 'ExternalEdit'
    if (item.route.wrapper) newModal = 'WrapperEdit'
    
    setModal(newModal)
  }

  const handleDelete = () => {
    setIsVisible(false)
    setActionItem(item)
    setModal('ItemDelete')
  }

  const elStyle = {
    marginLeft: depth !== undefined ? depth * 48 : 0,
    opacity: ghost ? 0.5 : 1,
    ...style,
  };

  return (
    <Box
      ref={wrapperRef} 
      style={elStyle}
    >
      <Box
        background={item.route.active ? 'neutral0' : 'neutral100'}
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
          <Flex>
            <Icon as={Drag} color="neutral800" {...handleProps}/>
            <Box
              marginLeft={4}
              marginRight={4}
              width="1px"
              height="32px"
              background="neutral150"
            />
            <RouteIcon type={type}/>
            <Flex gap={2} marginLeft={4}>
              <Typography fontWeight="bold">{item.route.title}</Typography>
              <Typography textColor="neutral400">{type === 'internal' && '/'}{item.route.fullPath}</Typography>
            </Flex>
            <Box
              marginLeft={4}
              marginRight={4}
              width="1px"
              height="32px"
              background="neutral150"
            />
            {item.items.length > 0 &&
              <Flex gap={2}>
                <IconButton onClick={() => setCollapsed(prev => !prev)}>
                  <ChevronDown style={{rotate: collapsed ? '-90deg' : '0deg', transition: 'all .3s ease'}}/>
                </IconButton>
                {collapsed && countChildren(item) > 0 && 
                  <Typography textColor="neutral400">
                    {countChildren(item)} children
                  </Typography>
                }
              </Flex>
            }
          </Flex>
          <Flex direction="row" gap={4}>
            {type === 'internal' && (isPublished ?
              <Status variant="success" size="S" showBullet={false}>
                <Typography fontWeight="bold" textColor="success700">
                  Published
                </Typography>
              </Status> :
              <Status variant="secondary" size="S" showBullet={false}>
                <Typography fontWeight="bold" textColor="secondary700">
                  Draft
                </Typography>
              </Status>
            )}
            <IconButton
              icon={<More />}
              label="Item actions"
              ref={actionButtonRef}
              onClick={() => setIsVisible(prev => !prev)}
            />
            {isVisible &&
              <Popover
                placement="bottom-end"
                source={actionButtonRef}
                onDismiss={() => setIsVisible(false)}
                spacing={4}
              >
                <Flex alignItems="stretch" direction="column">
                  <MenuItem onClick={() => handleEdit()}>Edit</MenuItem>
                  <MenuItem onClick={() => handleAddChildren()}>Add children</MenuItem>
                  <MenuItem onClick={() => handleDelete()}>
                    <Typography textColor="danger600">Delete</Typography>
                  </MenuItem>
                </Flex>
              </Popover>
            }
          </Flex>
        </Flex>
      </Box>
      {!collapsed && item.items.map((childItem: NestedNavItem, index) => (
        <RouteItem key={index} item={childItem} setParentId={setParentId} setActionItem={setActionItem}/>  
      ))}
    </Box>
  );
})
