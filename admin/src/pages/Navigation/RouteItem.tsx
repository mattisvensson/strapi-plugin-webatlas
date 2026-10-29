import { Box, Typography, Flex, IconButton, Badge } from '@strapi/design-system'
import { RouteItemProps } from '../../types'
import { ModalContext } from '../../contexts'
import { useContext, forwardRef, memo, useMemo, useState } from 'react'
import { Drag, ChevronDown, ChevronRight, Plus } from '@strapi/icons'
import RouteItemMenu from './RouteItemMenu'
import RouteItemStatus from './RouteItemStatus'
import RouteItemIcon from './RouteItemIcon'
import RouteItemBadge from './RouteItemBadge'
import { getNavItemPath, getTranslation } from '../../utils'
import { indentationWidth as defaultIndentationWidth } from '../../utils/dnd'
import { useIntl } from 'react-intl'

// Memoized because all items re-render on every drag event otherwise. Keep the props stable
// (state setters, useCallback, useMemo), new objects or inline functions disable the memoization.
export const RouteItem = memo(
	forwardRef<HTMLDivElement, RouteItemProps>(
		(
			{
				item,
				isMoved = false,
				movedChildCount = 0,
				onInsertBelow,
				disableInteraction,
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
				indentationWidth = defaultIndentationWidth,
				hasChildren = false,
				collapsed = false,
				onToggleCollapse,
			}: RouteItemProps,
			ref,
		) => {
			const { setModalType } = useContext(ModalContext)
			const { formatMessage } = useIntl()
			const [isHovered, setIsHovered] = useState(false)
			const [isInsertButtonActive, setIsInsertButtonActive] = useState(false)

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

			// Only marks the item, it is deleted when saving after a confirmation
			const handleDelete = () => {
				setNavigationItems((navItems) =>
					navItems?.map((navItem) =>
						navItem.documentId === item.documentId
							? {
									...navItem,
									clientModifications: { ...navItem.clientModifications, type: 'delete' },
								}
							: navItem,
					),
				)
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

			const isDeleted = item.clientModifications?.type === 'delete'

			const elStyle = {
				opacity: ghost || isDeleted ? 0.5 : 1,
				position: 'relative' as const,
				// Lift the hovered row, so its insert button overlaps the row below
				zIndex: isHovered ? 1 : undefined,
				...style,
			}

			const insertBelowLabel = formatMessage({
				id: getTranslation('navigation.page.navItem.insertBelow'),
				defaultMessage: 'Add item below',
			})

			if (!item || !item.route) return null

			return (
				<Box
					ref={wrapperRef}
					style={elStyle}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => {
						setIsHovered(false)
						setIsInsertButtonActive(false)
					}}
				>
					<Flex alignItems="stretch">
						{/* Indentation outside of the row, so the hierarchy shows in the background of the list */}
						<Box flex={`0 0 ${(depth ?? 0) * indentationWidth}px`} />
						<Flex
							ref={ref}
							flex="1"
							minWidth={0}
							alignItems="stretch"
							background={isDeleted ? 'danger100' : 'neutral0'}
							borderColor="neutral150"
							borderStyle="solid"
							borderWidth="0 0 1px 0"
						>
							<Flex paddingLeft={3} paddingRight={2}>
								<Drag color="neutral600" style={{ cursor: 'grab' }} {...handleProps} />
							</Flex>
							<Flex flex="1" minWidth={0} gap={2} paddingTop={2} paddingBottom={2} paddingRight={3}>
								<Flex flex={`0 0 ${indentationWidth}px`} justifyContent="center">
									{hasChildren && onToggleCollapse && (
										<IconButton
											variant="ghost"
											size="S"
											withTooltip={false}
											label={formatMessage(
												collapsed
													? {
															id: getTranslation('navigation.page.navItem.expand'),
															defaultMessage: 'Expand',
														}
													: {
															id: getTranslation('navigation.page.navItem.collapse'),
															defaultMessage: 'Collapse',
														},
											)}
											onClick={() => onToggleCollapse(item.documentId)}
										>
											{collapsed ? <ChevronRight /> : <ChevronDown />}
										</IconButton>
									)}
								</Flex>
								<RouteItemIcon type={item.route.type} />
								<Typography fontWeight="bold" ellipsis style={{ flex: 'none', maxWidth: '40%' }}>
									{item.clientModifications?.title
										? item.clientModifications.title
										: item.route.title}
								</Typography>
								{itemPath && (
									<Typography textColor="neutral500" ellipsis>
										/{itemPath}
									</Typography>
								)}
								<RouteItemStatus item={item} isUpdated={isMoved} />
								{movedChildCount > 0 && (
									<Badge flex="none">
										{formatMessage(
											{
												id: getTranslation('navigation.page.navItem.movedChildren'),
												defaultMessage: '+{count} {count, plural, one {child} other {children}}',
											},
											{ count: movedChildCount },
										)}
									</Badge>
								)}
								<Flex marginLeft="auto" gap={2} flex="none">
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
						</Flex>
					</Flex>
					{isHovered && onInsertBelow && !disableInteraction && !ghost && (
						// Sits on the border below the row, centered below the collapse toggle
						<Flex
							tag="button"
							type="button"
							aria-label={insertBelowLabel}
							title={insertBelowLabel}
							onClick={() => onInsertBelow(item)}
							// Highlighted on hover and keyboard focus
							onMouseEnter={() => setIsInsertButtonActive(true)}
							onMouseLeave={() => setIsInsertButtonActive(false)}
							onFocus={() => setIsInsertButtonActive(true)}
							onBlur={() => setIsInsertButtonActive(false)}
							position="absolute"
							bottom="-1rem"
							left={`calc(${(depth ?? 0) * indentationWidth}px + 3.6rem + ${indentationWidth / 2}px - 1rem)`}
							width="2rem"
							height="2rem"
							justifyContent="center"
							background={isInsertButtonActive ? 'primary700' : 'primary600'}
							transform={isInsertButtonActive ? 'scale(1.2)' : undefined}
							transition="transform 0.15s ease, background-color 0.15s ease"
							borderRadius="50%"
							borderStyle="none"
							cursor="pointer"
							zIndex={1}
						>
							<Plus width="1.2rem" height="1.2rem" fill="neutral0" />
						</Flex>
					)}
				</Box>
			)
		},
	),
)
