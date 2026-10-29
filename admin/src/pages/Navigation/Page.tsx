/*
 *
 * Navigation
 * This file contains the main logic for the Navigation page in the Strapi admin panel.
 * It handles the display and management of navigations, including creating, editing, and deleting navigation items.
 * It also supports drag-and-drop reordering of navigation items.
 *
 */

import { Check, Plus } from '@strapi/icons'
import { Flex, Button } from '@strapi/design-system'
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
} from '../../components/modals'
import { EmptyBox, Center, FullLoader } from '../../components/UI'
import { ModalContext, SelectedNavigationContext, EntitiesContext } from '../../contexts'
import type { GroupedEntities, NestedNavigation, NestedNavItem } from '../../../../types'
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
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getProjection, measuring, indentationWidth } from '../../utils/dnd'
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
	const { getNavigation, updateNavigationItemStructure, fetchAllEntities } = useApi()
	const [isSavingNavigation, setIsSavingNavigation] = useState(false)
	const [loading, setLoading] = useState(true)
	const cachedNavigations = useRef<NestedNavigation[] | null>(null)
	const [entities, setEntities] = useState<GroupedEntities[]>([])
	const entitiesRequestRef = useRef<Promise<void> | null>(null)
	const { config } = usePluginConfig()

	const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
	const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
	const [offsetLeft, setOffsetLeft] = useState(0)

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
		setNavigations(updatedNavigations)
		setSelectedNavigation(selectedNav)
		// Set before the items, the path sync compares against the initial items
		initialNavigationItemsRef.current = cloneDeep(selectedNav.items) || null
		setNavigationItems(selectedNav.items || [])
	}

	// The entries are only needed by the item modals, so they are loaded once when the first modal opens
	const loadEntities = useCallback(() => {
		if (entitiesRequestRef.current) return

		entitiesRequestRef.current = fetchAllEntities()
			.then(setEntities)
			.catch((error) => {
				// Allow the next modal to retry
				entitiesRequestRef.current = null
				if (!isAbortError(error)) console.error('Error fetching entities: ', error)
			})
	}, [])

	const entitiesContextValue = useMemo(() => ({ entities, loadEntities }), [entities, loadEntities])

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
		if (modalType === 'NavOverview' || modalType === '') {
			setActionItem(undefined)
			setActionItemParent(null)
		}
	}, [modalType])

	useEffect(() => {
		if (!selectedNavigation || !navigationItems) return

		setNavigations(
			navigations.map((nav) => {
				if (nav.documentId !== selectedNavigation.documentId) return nav
				return {
					...nav,
					items: navigationItems,
				}
			}),
		)
	}, [setNavigations, navigationItems, selectedNavigation])

	function handleSoftAddedItem(newItem: NestedNavItem) {
		if (newItem.clientModifications?.parent) {
			const parentIndex = navigationItems?.findIndex(
				(item) => item.documentId === newItem.clientModifications?.parent,
			)
			if (parentIndex !== undefined && parentIndex >= 0) {
				const parentDepth = navigationItems ? navigationItems[parentIndex].depth || 0 : 0
				newItem.depth = parentDepth + 1
				const updatedItems = navigationItems
					? [
							...navigationItems.slice(0, parentIndex + 1),
							newItem,
							...navigationItems.slice(parentIndex + 1),
						]
					: [newItem]
				setNavigationItems(updatedItems)
				return
			}
		}
		setNavigationItems((items) => (items ? [...items, newItem] : [newItem]))
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
			const { depth } = projected

			// Update the depth of the active item
			const overIndex = navigationItems.findIndex(({ id }) => id === over.id)
			const activeIndex = navigationItems.findIndex(({ id }) => id === active.id)
			const activeTreeItem = navigationItems[activeIndex]

			navigationItems[activeIndex] = { ...activeTreeItem, depth }

			const sortedItems = arrayMove(navigationItems, activeIndex, overIndex)

			// Fix potential depth issues
			const fixedItems = [...sortedItems]
			fixedItems[0].depth = 0
			for (let i = 1; i < fixedItems.length; i++) {
				const prev = fixedItems[i - 1].depth ?? 0
				let curr = fixedItems[i].depth ?? 0
				if (curr < 0) curr = 0
				if (curr > prev + 1) curr = prev + 1
				fixedItems[i].depth = curr
			}
			setNavigationItems(fixedItems)
		}
	}

	function resetState() {
		setOverId(null)
		setActiveId(null)
		setOffsetLeft(0)

		document.body.style.setProperty('cursor', '')
	}

	const projected = useMemo<Projected | null>(
		() =>
			activeId && overId
				? getProjection(
						navigationItems,
						activeId,
						overId,
						offsetLeft,
						config?.navigation.maxDepth || 3,
					)
				: null,
		[activeId, overId, offsetLeft, navigationItems, config],
	)

	const activeItem = useMemo(
		() => (activeId ? navigationItems?.find(({ id }) => id === activeId) : undefined),
		[navigationItems, activeId],
	)

	// The initial items only change together with the items when a navigation is (re)loaded
	const hasUnsavedChanges = useMemo(
		() => JSON.stringify(navigationItems) !== JSON.stringify(initialNavigationItemsRef.current),
		[navigationItems],
	)

	const initialItemsById = useMemo(
		() => new Map(initialNavigationItemsRef.current?.map((item) => [item.documentId, item])),
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
			<EntitiesContext.Provider value={entitiesContextValue}>
				<SelectedNavigationContext.Provider value={{ selectedNavigation, setSelectedNavigation }}>
					<PageWrapper navigations={navigations}>
						{selectedNavigation && (
							<Flex gap={4} paddingBottom={6} justifyContent="flex-end">
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
									onClick={() => saveNavigation()}
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
						)}
						{selectedNavigation && navigationItems && navigationItems.length > 0 && (
							<Flex direction="column" alignItems="stretch" gap={4}>
								<DndContext
									collisionDetection={(e) => closestCenter(e)}
									onDragStart={(e) => handleDragStart(e)}
									onDragMove={(e) => handleDragMove(e)}
									onDragOver={(e) => handleDragOver(e)}
									onDragEnd={(e) => handleDragEnd(e)}
									onDragCancel={() => handleDragCancel()}
									measuring={measuring}
								>
									<SortableContext items={navigationItems} strategy={verticalListSortingStrategy}>
										{navigationItems.map((item, index) => {
											const initialItem = initialItemsById.get(item.documentId)
											return (
												config?.navigation.maxDepth && (
													<SortableRouteItem
														key={item.documentId || index}
														item={item}
														initialItem={initialItem}
														setActionItemParent={setActionItemParent}
														setActionItem={setActionItem}
														setNavigationItems={setNavigationItems}
														indentationWidth={indentationWidth}
														depth={item.id === activeId && projected ? projected.depth : item.depth}
														maxDepth={config.navigation.maxDepth}
														navigationItems={navigationItems}
													/>
												)
											)
										})}
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
															/>
														)
													: null}
											</DragOverlay>,
											document.body,
										)}
									</SortableContext>
								</DndContext>
							</Flex>
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
					{modalType === 'NavOverview' && (
						<NavOverview navigations={navigations} setActionItem={setActionItem} />
					)}
					{modalType === 'NavCreate' && <NavCreate />}
					{modalType === 'NavDelete' && (
						<Delete
							variant="NavDelete"
							item={actionItem as NestedNavigation}
							onDelete={(deletedItem) => {
								cachedNavigations.current = null
								const remaining = navigations.filter((nav) => nav.id !== deletedItem.id)
								setNavigations(remaining)

								// Nur umleiten, wenn die gelöschte Navigation gerade angezeigt wird
								if (deletedItem.documentId === navigationId) {
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
							actionItemParent={actionItemParent}
							navigationItems={navigationItems || []}
							navigations={navigations}
							onCreate={(newItem) => {
								handleSoftAddedItem(newItem)
							}}
						/>
					)}
					{modalType === 'ItemDelete' && (
						<Delete
							variant="ItemDelete"
							item={actionItem as NestedNavItem}
							onDelete={(deletedItem) => {
								setNavigationItems((items) =>
									items?.map((item) => (item.id === deletedItem.id ? deletedItem : item)),
								)
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
							actionItemParentId={actionItemParent?.documentId}
							onCreate={(newItem) => {
								handleSoftAddedItem(newItem)
							}}
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
							actionItemParentId={actionItemParent?.documentId}
							onCreate={(newItem) => {
								handleSoftAddedItem(newItem)
							}}
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
			</EntitiesContext.Provider>
		</ModalContext.Provider>
	)
}

export default Navigation
