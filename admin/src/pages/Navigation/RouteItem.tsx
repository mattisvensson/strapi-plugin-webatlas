import { Box, Typography, Flex } from '@strapi/design-system'
import { RouteItemProps } from '../../types'
import { ModalContext } from '../../contexts'
import { useContext, forwardRef, memo, useMemo } from 'react'
import { Drag } from '@strapi/icons'
import RouteItemMenu from './RouteItemMenu'
import RouteItemStatus from './RouteItemStatus'
import RouteItemIcon from './RouteItemIcon'
import RouteItemBadge from './RouteItemBadge'
import { getNavItemPath } from '../../utils'

// Memoized because all items re-render on every drag event otherwise. Keep the props stable
// (state setters, useCallback, useMemo), new objects or inline functions disable the memoization.
export const RouteItem = memo(
	forwardRef<HTMLDivElement, RouteItemProps>(
		(
			{
				item,
				initialItem,
				setActionItemParent,
				setActionItem,
				setNavigationItems,
				ghost,
				depth,
				maxDepth,
				style,
				wrapperRef,
				handleProps,
				navigationItems,
			}: RouteItemProps,
			ref,
		) => {
			const { setModalType } = useContext(ModalContext)

			const hasStructureChanges = useMemo(() => {
				if (!initialItem) return false

				return initialItem.order !== item.order || initialItem.depth !== item.depth
			}, [initialItem, item.order, item.depth])

			// clientModifications.path is kept in sync centrally by the navigation page (syncNavItemPaths)
			const itemPath = useMemo(
				() => getNavItemPath(navigationItems ?? [], item),
				[navigationItems, item],
			)

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
				setNavigationItems((navItems) =>
					navItems?.map((navItem) => {
						if (navItem.documentId === item.documentId) {
							const { clientModifications: _, ...rest } = navItem
							return navItem.initialClientModifications
								? {
										...rest,
										clientModifications: navItem.initialClientModifications,
									}
								: rest
						}
						return navItem
					}),
				)
			}

			const elStyle = {
				marginLeft: depth !== undefined ? depth * 48 : 0,
				opacity: ghost || item.clientModifications?.type === 'delete' ? 0.5 : 1,
				...style,
			}

			if (!item || !item.route) return null

			return (
				<Box ref={wrapperRef} style={elStyle}>
					<Box
						background="neutral0"
						borderColor={item.clientModifications?.type === 'delete' ? 'danger500' : 'neutral150'}
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
								<Drag color="neutral800" {...handleProps} />
								<Box width="1px" height="32px" background="neutral150" />
								<RouteItemIcon type={item.route.type} />
								<Flex gap={2}>
									<Typography fontWeight="bold">
										{item.clientModifications?.title
											? item.clientModifications.title
											: item.route.title}
									</Typography>
									{itemPath && <Typography textColor="neutral400">/{itemPath}</Typography>}
								</Flex>
								<RouteItemStatus item={item} isUpdated={hasStructureChanges} />
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
			)
		},
	),
)
