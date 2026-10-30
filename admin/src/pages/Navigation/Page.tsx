/*
 *
 * Navigation
 * This file contains the main logic for the Navigation page in the Strapi admin panel.
 * It handles the display and management of navigations, including creating, editing, and deleting navigation items.
 * It also supports drag-and-drop reordering of navigation items.
 *
 */

import { Check, Plus } from '@strapi/icons'
import { Flex, Button, Box, Searchbar, Typography } from '@strapi/design-system'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
	NavOverview,
	NavCreate,
	Delete,
	NavEdit,
	ItemCreate,
	ItemEdit,
	ExternalItem,
	WrapperItem,
	SaveConfirm,
} from '../../components/modals'
import { EmptyBox, Center, FullLoader } from '../../components/UI'
import { ModalContext, SelectedNavigationContext, ContentTypesContext } from '../../contexts'
import type { NestedNavigation, NestedNavItem } from '../../../../types'
import { useApi, useErrorMessage, usePluginConfig } from '../../hooks/'
import { getTranslation, isAbortError, syncNavItemPaths } from '../../utils'
import { useIntl } from 'react-intl'
import { useNotification } from '@strapi/strapi/admin'
import {
	DndContext,
	closestCenter,
	DragStartEvent,
	DragOverlay,
	DragMoveEvent,
	DragEndEvent,
	DragOverEvent,
	UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getProjection, measuring, indentationWidth } from '../../utils/dnd'
import {
	getCollapsedVisibleItems,
	getDescendantCount,
	getItemsWithChildren,
	getMovedItemIds,
	getParentItem,
	getSearchVisibleItems,
	getSubtreeDepth,
	moveNavItem,
} from '../../utils/navTree'
import useCollapsedItems, { removeCollapsedItems } from './useCollapsedItems'
import UnsavedChangesBlocker from './UnsavedChangesBlocker'
import SortableRouteItem from './SortableRouteItem'
import { RouteItem } from './RouteItem'
import PageWrapper from './PageWrapper'
import cloneDeep from 'lodash/cloneDeep'
import { useParams, useNavigate } from 'react-router-dom'
import { PLUGIN_ID } from '../../../../utils'

type Projected = {
	depth: number
	maxDepth: number
	minDepth: number
}

const Navigation = () => {
	const [navigations, setNavigations] = useState<NestedNavigation[]>([])
	const [modalType, setModalType] = useState<string>('')
	const [selectedNavigation, setSelectedNavigation] = useState<NestedNavigation>()
	const [navigationItems, setSyncedNavigationItems] = useState<NestedNavItem[]>()
	const initialNavigationItemsRef = useRef<NestedNavItem[] | null>(null)
	// Every change of the items keeps the paths of the internal items in sync in a single pass
	const setNavigationItems: React.Dispatch<React.SetStateAction<NestedNavItem[] | undefined>> =
		useCallback((action) => {
			setSyncedNavigationItems((items) => {
				const nextItems = typeof action === 'function' ? action(items) : action
				return nextItems && syncNavItemPaths(nextItems, initialNavigationItemsRef.current)
			})
		}, [])
	const [actionItem, setActionItem] = useState<NestedNavItem | NestedNavigation>()
	const [actionItemParent, setActionItemParent] = useState<NestedNavItem | null>(null)
	// Item below which a new item is inserted via the insert button of a row
	const [insertBelowItem, setInsertBelowItem] = useState<NestedNavItem | null>(null)
	const { getNavigation, updateNavigationItemStructure } = useApi()
	const [isSavingNavigation, setIsSavingNavigation] = useState(false)
	const [loading, setLoading] = useState(true)
	const cachedNavigations = useRef<NestedNavigation[] | null>(null)
	// Set before navigating away from a deleted navigation, its unsaved changes are obsolete
	const skipUnsavedChangesWarningRef = useRef(false)
	const { config } = usePluginConfig()

	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
	const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
	const [offsetLeft, setOffsetLeft] = useState(0)

	const [searchQuery, setSearchQuery] = useState('')
	const isSearching = searchQuery.trim() !== ''
	const { collapsedIds, toggleCollapsed, expand, setCollapsedIds } = useCollapsedItems(
		selectedNavigation?.documentId,
	)

	const { formatMessage } = useIntl()
	const { toggleNotification } = useNotification()
	const getErrorMessage = useErrorMessage()
	const { navigationId } = useParams()
	const navigate = useNavigate()

	async function loadNavigations() {
		try {
			const updatedNavigations: NestedNavigation[] = await getNavigation({ variant: 'flat' })

			let selectedNav = updatedNavigations.find((nav) => nav.documentId === navigationId)

			if (!selectedNav) {
				selectedNav = updatedNavigations[0]

				toggleNotification({
					type: 'danger',
					message:
						formatMessage({
							id: getTranslation('notification.navigation.notFound'),
							defaultMessage: 'Navigation not found. Redirected to navigation',
						}) +
						': ' +
						updatedNavigations[0]?.name,
				})
				navigate(`/plugins/${PLUGIN_ID}/navigation/${updatedNavigations[0]?.documentId}`)
				return
			}

			cachedNavigations.current = updatedNavigations
			switchNavigation(selectedNav, updatedNavigations)
		} catch (error) {
			if (isAbortError(error)) return

			console.error('Error fetching navigations: ', error)
			toggleNotification({
				type: 'danger',
				message: getErrorMessage(
					error,
					formatMessage({
						id: getTranslation('notification.navigation.fetchFailed'),
						defaultMessage: 'Failed to fetch navigations',
					}),
				),
			})
		}
	}

	function switchNavigation(selectedNav: NestedNavigation, updatedNavigations: NestedNavigation[]) {
		skipUnsavedChangesWarningRef.current = false
		setNavigations(updatedNavigations)
		setSelectedNavigation(selectedNav)
		// Set before the items, the path sync compares against the initial items
		initialNavigationItemsRef.current = cloneDeep(selectedNav.items) || null
		setNavigationItems(selectedNav.items || [])
	}

	// The entries of the content types are searched page by page in the item modals, so only the
	// content types are provided here
	const contentTypesContextValue = useMemo(
		() => ({ contentTypes: config?.selectedContentTypes ?? [] }),
		[config],
	)

	useEffect(() => {
		async function fetchNavigations() {
			if (!navigationId) {
				const navs = await getNavigation({ variant: 'namesOnly' })
				if (navs && navs.length > 0)
					navigate(`/plugins/${PLUGIN_ID}/navigation/${navs[0].documentId}`)
				setLoading(false)
				return
			}

			// If cached, use it
			if (cachedNavigations.current) {
				const selectedNav = cachedNavigations.current.find((nav) => nav.documentId === navigationId)
				if (selectedNav) {
					switchNavigation(selectedNav, cachedNavigations.current)
					setLoading(false)
					return
				}
			}

			// Otherwise, load from API
			setLoading(true)
			await loadNavigations()
			setLoading(false)
		}
		fetchNavigations()
	}, [navigationId])

	useEffect(() => {
		setSearchQuery('')
	}, [selectedNavigation?.documentId])

	useEffect(() => {
		if (modalType === 'NavOverview' || modalType === '') {
			setActionItem(undefined)
			setActionItemParent(null)
			setInsertBelowItem(null)
		}
	}, [modalType])

	const handleInsertBelow = useCallback((item: NestedNavItem) => {
		setInsertBelowItem(item)
		setModalType('ItemCreate')
	}, [])

	// The navigations with the unsaved items of the selected one, derived instead of synced into the state
	const navigationsWithCurrentItems = useMemo(
		() =>
			navigations.map((nav) =>
				nav.documentId === selectedNavigation?.documentId && navigationItems
					? { ...nav, items: navigationItems }
					: nav,
			),
		[navigations, selectedNavigation?.documentId, navigationItems],
	)

	// All new items share the same parent and are inserted in the given order
	function handleSoftAddedItems(newItems: NestedNavItem[]) {
		if (newItems.length === 0) return

		const insertAt = (index: number, depth: number) => {
			newItems.forEach((newItem) => (newItem.depth = depth))
			setNavigationItems((items) => [
				...(items ?? []).slice(0, index),
				...newItems,
				...(items ?? []).slice(index),
			])
		}

		if (insertTarget) return insertAt(insertTarget.index, insertTarget.depth)

		const parentId = newItems[0].clientModifications?.parent
		const parentIndex = parentId
			? (navigationItems?.findIndex((item) => item.documentId === parentId) ?? -1)
			: -1
		if (parentId && navigationItems && parentIndex >= 0) {
			// Show the new items, even if they are added to a collapsed item
			expand(parentId)
			return insertAt(parentIndex + 1, (navigationItems[parentIndex].depth || 0) + 1)
		}

		setNavigationItems((items) => [...(items ?? []), ...newItems])
	}

	async function saveNavigation() {
		if (!navigationItems || !selectedNavigation) return

		setIsSavingNavigation(true)

		try {
			const result = await updateNavigationItemStructure(
				selectedNavigation.documentId,
				navigationItems,
			)

			// The endpoint reports per-item failures in its payload instead of failing the request
			if (result?.success === false) throw new Error(result.errors?.[0])

			toggleNotification({
				type: 'success',
				message: formatMessage({
					id: getTranslation('notification.navigation.navigationSaved'),
					defaultMessage: 'Navigation updated successfully',
				}),
			})
		} catch (e) {
			console.error(e)
			toggleNotification({
				type: 'danger',
				message: getErrorMessage(
					e,
					// The per-item failures of updateNavigationItemStructure arrive as a local Error
					e instanceof Error && e.message
						? e.message
						: formatMessage({
								id: getTranslation('notification.navigation.saveNavigationFailed'),
								defaultMessage: 'Error updating navigation item',
							}),
				),
			})
		} finally {
			await loadNavigations()
			setIsSavingNavigation(false)
		}
	}

	// React DnD Handlers --------------------------------------------------------

	function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
		if (!navigationItems) return

		setActiveId(activeId)
		setOverId(activeId)

		document.body.style.setProperty('cursor', 'grabbing')
	}

	function handleDragMove({ delta }: DragMoveEvent) {
		// Snap to the indentation steps, so the page only re-renders when the projected depth can change
		setOffsetLeft(Math.round(delta.x / indentationWidth) * indentationWidth)
	}

	function handleDragOver({ over }: DragOverEvent) {
		setOverId(over?.id ?? null)
	}

	function handleDragCancel() {
		resetState()
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		resetState()

		if (projected && over && navigationItems) {
			const movedItems = moveNavItem(
				navigationItems,
				visibleItems,
				active.id,
				over.id,
				projected.depth,
			)
			setNavigationItems(movedItems)

			// Show the moved item, even if it is dropped into a collapsed item
			const parentItem = getParentItem(movedItems, active.id)
			if (parentItem) expand(parentItem.documentId)
		}
	}

	function resetState() {
		setOverId(null)
		setActiveId(null)
		setOffsetLeft(0)

		document.body.style.setProperty('cursor', '')
	}

	const visibleItems = useMemo(() => {
		if (!navigationItems) return []
		return isSearching
			? getSearchVisibleItems(navigationItems, searchQuery)
			: getCollapsedVisibleItems(navigationItems, collapsedIds)
	}, [navigationItems, isSearching, searchQuery, collapsedIds])

	const itemsWithChildren = useMemo(
		() => getItemsWithChildren(navigationItems ?? []),
		[navigationItems],
	)

	const deletedItems = useMemo(
		() => (navigationItems ?? []).filter((item) => item.clientModifications?.type === 'delete'),
		[navigationItems],
	)

	// A new item inserted below an item appears directly below it: as first child of an expanded item
	// with children, otherwise as next sibling behind the (collapsed) children
	const insertTarget = useMemo(() => {
		if (!insertBelowItem || !navigationItems) return null

		const index = navigationItems.findIndex(
			({ documentId }) => documentId === insertBelowItem.documentId,
		)
		if (index === -1) return null

		const depth = insertBelowItem.depth ?? 0
		if (
			itemsWithChildren.has(insertBelowItem.documentId) &&
			!collapsedIds.has(insertBelowItem.documentId)
		) {
			return { index: index + 1, depth: depth + 1, parent: insertBelowItem }
		}

		return {
			index: index + 1 + getDescendantCount(navigationItems, index),
			depth,
			parent: getParentItem(navigationItems, insertBelowItem.id) ?? null,
		}
	}, [insertBelowItem, navigationItems, itemsWithChildren, collapsedIds])

	const createItemParent = insertTarget ? insertTarget.parent : actionItemParent

	const projected = useMemo<Projected | null>(() => {
		if (!activeId || !overId || !navigationItems) return null

		// A collapsed item takes its children along, they must not exceed the maximum depth either
		const activeIndex = navigationItems.findIndex(({ id }) => id === activeId)
		const activeItemToMove = navigationItems[activeIndex]
		const childLevels =
			activeItemToMove && collapsedIds.has(activeItemToMove.documentId)
				? getSubtreeDepth(navigationItems, activeIndex)
				: 0

		return getProjection(
			visibleItems,
			activeId,
			overId,
			offsetLeft,
			Math.max(0, (config?.navigation.maxDepth || 3) - childLevels),
		)
	}, [activeId, overId, offsetLeft, navigationItems, visibleItems, collapsedIds, config])

	const activeItem = useMemo(
		() => (activeId ? navigationItems?.find(({ id }) => id === activeId) : undefined),
		[navigationItems, activeId],
	)

	// Only collapsed items take their children along when dragged
	const movedChildCount = useMemo(() => {
		if (!activeItem || !navigationItems || !collapsedIds.has(activeItem.documentId)) return 0
		return getDescendantCount(navigationItems, navigationItems.indexOf(activeItem))
	}, [activeItem, navigationItems, collapsedIds])

	// The initial items only change together with the items when a navigation is (re)loaded
	const hasUnsavedChanges = useMemo(
		() => JSON.stringify(navigationItems) !== JSON.stringify(initialNavigationItemsRef.current),
		[navigationItems],
	)

	// The initial items only change together with the items when a navigation is (re)loaded
	const movedItemIds = useMemo(
		() => getMovedItemIds(initialNavigationItemsRef.current ?? [], navigationItems ?? []),
		[navigationItems],
	)

	// Stable context value, otherwise every page render re-renders all memoized route items
	const modalContextValue = useMemo(() => ({ modalType, setModalType }), [modalType])

	if (loading) {
		return (
			<PageWrapper navigations={navigations} loading={loading}>
				<FullLoader />
			</PageWrapper>
		)
	}

	return (
		<ModalContext.Provider value={modalContextValue}>
			<ContentTypesContext.Provider value={contentTypesContextValue}>
				<SelectedNavigationContext.Provider value={{ selectedNavigation, setSelectedNavigation }}>
					<PageWrapper navigations={navigations}>
						{selectedNavigation && (
							<Flex
								gap={4}
								paddingBottom={4}
								justifyContent="space-between"
								alignItems="flex-start"
							>
								<Flex gap={2} alignItems="center">
									<Box width="30rem">
										<Searchbar
											name="navigation-item-search"
											value={searchQuery}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setSearchQuery(e.target.value)
											}
											onClear={() => setSearchQuery('')}
											clearLabel={formatMessage({
												id: getTranslation('navigation.page.search.clear'),
												defaultMessage: 'Clear search',
											})}
											placeholder={formatMessage({
												id: getTranslation('navigation.page.search.placeholder'),
												defaultMessage: 'Search by title or path',
											})}
										>
											{formatMessage({
												id: getTranslation('navigation.page.search.placeholder'),
												defaultMessage: 'Search by title or path',
											})}
										</Searchbar>
									</Box>
									<Button
										variant="tertiary"
										size="S"
										onClick={() => setCollapsedIds(new Set(itemsWithChildren))}
										disabled={isSearching}
									>
										{formatMessage({
											id: getTranslation('navigation.page.collapseAll'),
											defaultMessage: 'Collapse all',
										})}
									</Button>
									<Button
										variant="tertiary"
										size="S"
										onClick={() => setCollapsedIds(new Set())}
										disabled={isSearching}
									>
										{formatMessage({
											id: getTranslation('navigation.page.expandAll'),
											defaultMessage: 'Expand all',
										})}
									</Button>
								</Flex>
								<Flex gap={4}>
									<Button
										variant="secondary"
										startIcon={<Plus />}
										onClick={() => setModalType('ItemCreate')}
									>
										{formatMessage({
											id: getTranslation('navigation.page.newItemButton'),
											defaultMessage: 'New Item',
										})}
									</Button>
									<Button
										// Items are only soft deleted until saving, so the deletion is confirmed here
										onClick={() =>
											deletedItems.length > 0 ? setModalType('SaveConfirm') : saveNavigation()
										}
										loading={isSavingNavigation}
										variant="default"
										startIcon={<Check />}
										disabled={!hasUnsavedChanges}
									>
										{formatMessage({
											id: getTranslation('save'),
											defaultMessage: 'Save',
										})}
									</Button>
								</Flex>
							</Flex>
						)}
						{isSearching && (
							<Box paddingBottom={2}>
								<Typography variant="pi" textColor="neutral600">
									{formatMessage({
										id: getTranslation('navigation.page.search.dragDisabled'),
										defaultMessage: 'Drag and drop is disabled while searching.',
									})}
								</Typography>
							</Box>
						)}
						{selectedNavigation && navigationItems && navigationItems.length > 0 && (
							<Box>
								<DndContext
									collisionDetection={(e) => closestCenter(e)}
									onDragStart={(e) => handleDragStart(e)}
									onDragMove={(e) => handleDragMove(e)}
									onDragOver={(e) => handleDragOver(e)}
									onDragEnd={(e) => handleDragEnd(e)}
									onDragCancel={() => handleDragCancel()}
									measuring={measuring}
								>
									<SortableContext
										items={visibleItems}
										strategy={verticalListSortingStrategy}
										disabled={isSearching}
									>
										{visibleItems.map((item, index) => {
											return (
												config?.navigation.maxDepth && (
													<SortableRouteItem
														key={item.documentId || index}
														item={item}
														isMoved={movedItemIds.has(item.documentId)}
														setActionItemParent={setActionItemParent}
														setActionItem={setActionItem}
														setNavigationItems={setNavigationItems}
														indentationWidth={indentationWidth}
														depth={item.id === activeId && projected ? projected.depth : item.depth}
														maxDepth={config.navigation.maxDepth}
														navigationItems={navigationItems}
														hasChildren={itemsWithChildren.has(item.documentId)}
														collapsed={collapsedIds.has(item.documentId)}
														onToggleCollapse={isSearching ? undefined : toggleCollapsed}
														onInsertBelow={isSearching ? undefined : handleInsertBelow}
													/>
												)
											)
										})}
										{isSearching && visibleItems.length === 0 && (
											<Box padding={4}>
												<Typography textColor="neutral600">
													{formatMessage({
														id: getTranslation('navigation.page.search.noResults'),
														defaultMessage: 'No items found',
													})}
												</Typography>
											</Box>
										)}
										{createPortal(
											<DragOverlay>
												{/* Must not use useSortable, a second sortable with the same id breaks dnd-kit */}
												{activeId && activeItem
													? config?.navigation.maxDepth && (
															<RouteItem
																item={activeItem}
																ghost
																setActionItemParent={setActionItemParent}
																setActionItem={setActionItem}
																setNavigationItems={setNavigationItems}
																maxDepth={config.navigation.maxDepth}
																navigationItems={navigationItems}
																hasChildren={itemsWithChildren.has(activeItem.documentId)}
																collapsed={collapsedIds.has(activeItem.documentId)}
																movedChildCount={movedChildCount}
															/>
														)
													: null}
											</DragOverlay>,
											document.body,
										)}
									</SortableContext>
								</DndContext>
							</Box>
						)}
						{navigations?.length === 0 && (
							<Center height={400}>
								<EmptyBox
									msg={formatMessage({
										id: getTranslation('navigation.page.emptyNavigation'),
										defaultMessage: 'You have no navigations yet...',
									})}
								/>
								<Button variant="default" onClick={() => setModalType('NavCreate')}>
									{formatMessage({
										id: getTranslation('navigation.page.createNewNavigation'),
										defaultMessage: 'Create new navigation',
									})}
								</Button>
							</Center>
						)}
						{navigations && navigationItems?.length === 0 && (
							<Center height={400}>
								<EmptyBox msg="Your navigation is empty..." />
								<Button variant="default" onClick={() => setModalType('ItemCreate')}>
									{formatMessage({
										id: getTranslation('navigation.page.createNewItem'),
										defaultMessage: 'Create new item',
									})}
								</Button>
							</Center>
						)}
					</PageWrapper>
					<UnsavedChangesBlocker when={hasUnsavedChanges} skipRef={skipUnsavedChangesWarningRef} />
					{modalType === 'NavOverview' && (
						<NavOverview navigations={navigations} setActionItem={setActionItem} />
					)}
					{modalType === 'NavCreate' && <NavCreate />}
					{modalType === 'NavDelete' && (
						<Delete
							item={actionItem as NestedNavigation}
							onDelete={(deletedItem) => {
								cachedNavigations.current = null
								removeCollapsedItems(deletedItem.documentId)
								const remaining = navigations.filter((nav) => nav.id !== deletedItem.id)
								setNavigations(remaining)

								// Nur umleiten, wenn die gelöschte Navigation gerade angezeigt wird
								if (deletedItem.documentId === navigationId) {
									skipUnsavedChangesWarningRef.current = true
									navigate(
										remaining.length > 0
											? `/plugins/${PLUGIN_ID}/navigation/${remaining[0].documentId}`
											: `/plugins/${PLUGIN_ID}/navigation`,
									)
								}
							}}
						/>
					)}
					{modalType === 'NavEdit' && (
						<NavEdit
							item={actionItem as NestedNavigation}
							onEdit={(editedNavigation: NestedNavigation) => {
								setNavigations((navs) =>
									navs?.map((nav) => (nav.id === editedNavigation.id ? editedNavigation : nav)),
								)
							}}
						/>
					)}
					{modalType === 'ItemCreate' && (
						<ItemCreate
							actionItemParent={createItemParent}
							navigationItems={navigationItems || []}
							navigations={navigationsWithCurrentItems}
							onCreate={handleSoftAddedItems}
						/>
					)}
					{modalType === 'SaveConfirm' && (
						<SaveConfirm
							deletedItems={deletedItems}
							hasOrphanedChildren={deletedItems.some((item) =>
								itemsWithChildren.has(item.documentId),
							)}
							onConfirm={() => {
								setModalType('')
								saveNavigation()
							}}
						/>
					)}
					{modalType === 'ItemEdit' && (
						<ItemEdit
							item={actionItem as NestedNavItem}
							navigationItems={navigationItems || []}
							onEdit={(editedItem) => {
								setNavigationItems((items) =>
									items?.map((item) => (item.id === editedItem.id ? editedItem : item)),
								)
							}}
						/>
					)}
					{modalType === 'ExternalCreate' && (
						<ExternalItem
							variant={modalType}
							actionItemParentId={createItemParent?.documentId}
							onCreate={(newItem) => handleSoftAddedItems([newItem])}
						/>
					)}
					{modalType === 'ExternalEdit' && (
						<ExternalItem
							variant={modalType}
							item={actionItem as NestedNavItem}
							onSave={(editedItem) => {
								setNavigationItems((items) =>
									items?.map((item) => (item.id === editedItem.id ? editedItem : item)),
								)
							}}
						/>
					)}
					{modalType === 'WrapperCreate' && (
						<WrapperItem
							variant={modalType}
							actionItemParentId={createItemParent?.documentId}
							onCreate={(newItem) => handleSoftAddedItems([newItem])}
						/>
					)}
					{modalType === 'WrapperEdit' && (
						<WrapperItem
							variant={modalType}
							item={actionItem as NestedNavItem}
							onSave={(editedItem) => {
								setNavigationItems((items) =>
									items?.map((item) => (item.id === editedItem.id ? editedItem : item)),
								)
							}}
						/>
					)}
				</SelectedNavigationContext.Provider>
			</ContentTypesContext.Provider>
		</ModalContext.Provider>
	)
}

export default Navigation
