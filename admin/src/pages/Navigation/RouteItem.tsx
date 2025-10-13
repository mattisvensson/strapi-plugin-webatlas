import { Box, Typography, Flex, SimpleMenu, MenuItem, IconButton, Status } from '@strapi/design-system';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { ModalContext } from '../../contexts';
import { useContext, useEffect, useState, ReactElement, forwardRef } from 'react';
import { Link as LinkIcon, ExternalLink, OneToMany, More, Drag } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';

export interface RouteItemProps {
  item: NestedNavItem;
  setParentId: (id: string) => void;
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
      return <ExternalLink color={color}/>
    case "wrapper":
      return <OneToMany color={color}/>
    case "internal":
      return <LinkIcon color={color}/>
    default:
      return <Box width="16px" height="16px"/>
  }
}
export const RouteItem = forwardRef<HTMLDivElement, RouteItemProps>(({item, setParentId, setActionItem, ghost, depth, style, wrapperRef, handleProps}: RouteItemProps, ref) => {
  const { setModalType } = useContext(ModalContext);
  const { get } = useFetchClient();

  const [itemStatus, setItemStatus] = useState({
    status: 'published',
    variant: 'primary',
    textColor: 'primary700'
  })
  const [type, setType] = useState<RouteType>()

  if (!item || !item.route) return null

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
    const id = item.route.relatedDocumentId

    if (!ct || !id) return

    async function fetchRelated() {
      try {
        const { data } = await get(`/content-manager/collection-types/${ct}/${id}`)

        switch (data.data.status) {
          case "modified":
            setItemStatus({
              status: 'Modified',
              variant: 'alternative',
              textColor: 'alternative700'
            })
            break;
          case "draft":
            setItemStatus({
              status: 'Draft',
              variant: 'secondary',
              textColor: 'secondary700'
            })
            break;
          default:
            setItemStatus({
              status: 'Published',
              variant: 'primary',
              textColor: 'primary700'
            })
        }
      } catch (err) {
        console.log(err)
      }
    }
    fetchRelated()
  }, [])


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
          <Flex>
            <Drag color="neutral800" {...handleProps}/>
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
          </Flex>
          <Flex direction="row" gap={4}>
            {type === 'internal' && 
              <Status variant={itemStatus.variant} size="S">
                <Typography fontWeight="bold" textColor={itemStatus.textColor}>
                  {itemStatus.status}
                </Typography>
              </Status>
            }
            <SimpleMenu label="Notifications" tag={IconButton} icon={<More />}>
              <MenuItem onClick={() => handleEdit()}>Edit</MenuItem>
              <MenuItem onClick={() => handleAddChildren()}>Add children</MenuItem>
              <MenuItem onClick={() => handleDelete()}>
                <Typography textColor="danger600">Delete</Typography>
              </MenuItem>
            </SimpleMenu>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
})