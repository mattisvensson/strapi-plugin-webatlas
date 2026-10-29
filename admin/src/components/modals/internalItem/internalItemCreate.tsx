import type { ConfigContentType, Entity, Route } from '../../../../../types'
import type { ExtendedPanelPathState, ModalItem_VariantCreate } from '../../../types'
import { Box, Button, Divider, Field, Flex } from '@strapi/design-system'
import { withModalSharedLogic } from '../withModalSharedLogic'
import { useEffect, useMemo, useState } from 'react'
import { useModalSharedLogic } from '../useModalSharedLogic'
import { NavModal } from '../'
import { useIntl } from 'react-intl'
import {
	getTranslation,
	createTempNavItemObject,
	isAbortError,
	buildBreadcrumbString,
} from '../../../utils'
import { FullLoader } from '../../UI'
import { useApi, useErrorMessage } from '../../../hooks'
import { useNotification } from '@strapi/strapi/admin'
import ItemDetails from './ItemDetails'
import EntrySelection, { getSelectionKey } from './EntrySelection'
import type { SelectedEntry } from './EntrySelection'
import MultiItemReview, { isRowValid } from './MultiItemReview'
import type { ReviewRow } from './MultiItemReview'

// Select entries first, then edit a single entry in the details form or review several entries
type Step = 'select' | 'details' | 'review'

function ItemCreateComponent({
	availableContentTypes,
	selectedContentType,
	setSelectedContentType,
	validationState,
	isBlacklisted,
	navItemState,
	dispatchNavItemState,
	path,
	dispatchPath,
	debouncedCheckUrl,
	cancelUrlCheck,
	debouncedCheckBlacklist,
	setModalType,
	selectedNavigation,
	actionItemParent,
	onCreate,
	navigationItems,
	navigations,
}: ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>) {
	const [step, setStep] = useState<Step>('select')
	const [searchContentType, setSearchContentType] = useState<ConfigContentType>()
	const [query, setQuery] = useState('')
	const [selectedEntries, setSelectedEntries] = useState<Map<string, SelectedEntry>>(new Map())
	const [reviewRows, setReviewRows] = useState<ReviewRow[]>([])
	const [route, setRoute] = useState<Route | null>(null)
	const [entity, setEntity] = useState<Entity | null>(null)
	const [loadingRoute, setLoadingRoute] = useState(true)
	const { formatMessage } = useIntl()
	const { getRelatedRoute } = useApi()
	const { toggleNotification } = useNotification()
	const getErrorMessage = useErrorMessage()

	const selectedEntryList = useMemo(() => [...selectedEntries.values()], [selectedEntries])

	useEffect(() => {
		if (!searchContentType && availableContentTypes.length > 0) {
			setSearchContentType(availableContentTypes[0])
		}
	}, [availableContentTypes])

	const positionText = useMemo(() => {
		if (!actionItemParent) return null
		return buildBreadcrumbString({ navigationItems, targetItem: actionItemParent })
	}, [actionItemParent, navigationItems])

	// Navigations in which an entry is already used, by the documentId of the entry
	const usageByDocumentId = useMemo(() => {
		const usage = new Map<string, string>()
		navigations?.forEach((navigation) =>
			navigation.items.forEach((item) => {
				const documentId = item.route?.relatedDocumentId
				if (!documentId || usage.has(documentId)) return
				usage.set(
					documentId,
					navigation.documentId === selectedNavigation?.documentId
						? formatMessage({
								id: getTranslation('modal.entrySelection.usedHere'),
								defaultMessage: 'Already in this navigation',
							})
						: formatMessage(
								{
									id: getTranslation('modal.entrySelection.usedIn'),
									defaultMessage: 'In "{navigationName}"',
								},
								{ navigationName: navigation.name },
							),
				)
			}),
		)
		return usage
	}, [navigations, selectedNavigation])

	const toggleEntry = (selectedEntry: SelectedEntry) =>
		setSelectedEntries((current) => {
			const next = new Map(current)
			const key = getSelectionKey(selectedEntry.contentType, selectedEntry.entry)
			if (!next.delete(key)) next.set(key, selectedEntry)
			return next
		})

	const goToNextStep = () => {
		if (selectedEntryList.length === 1) {
			const [{ entry, contentType }] = selectedEntryList
			setSelectedContentType(contentType)
			setEntity(entry)
			setStep('details')
		} else if (selectedEntryList.length > 1) {
			setStep('review')
		}
	}

	const goBack = () => {
		if (step === 'review') {
			// Entries removed in the review are removed from the selection as well
			const remainingKeys = new Set(reviewRows.map(({ key }) => key))
			setSelectedEntries(
				(current) => new Map([...current].filter(([key]) => remainingKeys.has(key))),
			)
		}
		setEntity(null)
		setRoute(null)
		setStep('select')
	}

	useEffect(() => {
		async function fetchRoute() {
			if (!selectedContentType || !entity?.documentId) return setLoadingRoute(false)

			setLoadingRoute(true)
			try {
				const relatedRoute = await getRelatedRoute(entity.documentId)

				// TODO: Create a route if not existing or show error
				if (!relatedRoute) throw new Error('No route found for the selected entity')

				dispatchPath({ type: 'NO_URL_CHECK', payload: relatedRoute.path })
				dispatchPath({ type: 'SET_SLUG', payload: relatedRoute.slug })
				dispatchPath({ type: 'SET_INITIALPATH', payload: relatedRoute.path })
				dispatchPath({
					type: 'SET_CANONICALPATH',
					payload: relatedRoute.canonicalPath,
				})

				dispatchNavItemState({ type: 'SET_TITLE', payload: relatedRoute.title })
				dispatchNavItemState({
					type: 'SET_ACTIVE',
					payload: relatedRoute.active,
				})
				dispatchNavItemState({
					type: 'SET_OVERRIDE',
					payload: relatedRoute.isOverride,
				})

				setRoute(relatedRoute)
			} catch (err) {
				if (isAbortError(err)) return

				console.error(err)
				toggleNotification({
					type: 'danger',
					message: getErrorMessage(
						err,
						formatMessage({
							id: getTranslation('notification.navigation.relatedRouteFetchFailed'),
							defaultMessage: 'Failed to load the route of the selected entry',
						}),
					),
				})
			} finally {
				setLoadingRoute(false)
			}
		}
		fetchRoute()
	}, [entity])

	const addItem = async () => {
		try {
			if (
				!selectedContentType ||
				!entity?.documentId ||
				!path ||
				!path.value?.trim() ||
				!navItemState.title ||
				!navItemState.title?.trim() ||
				!selectedNavigation ||
				!route ||
				// The path is not checked yet
				validationState === 'checking'
			)
				return

			const newItem = createTempNavItemObject({
				actionItemParentId: actionItemParent?.documentId,
				entityRoute: route,
				selectedNavigation,
				navItemState,
				selectedEntity: entity,
				selectedContentType,
				path,
			})
			onCreate([newItem])

			setModalType('')
		} catch (err) {
			console.error(err)
		}
	}

	const canAddReviewedItems = reviewRows.length > 0 && reviewRows.every(isRowValid)

	const addReviewedItems = () => {
		if (!canAddReviewedItems || !selectedNavigation) return

		const newItems = reviewRows.map((row) =>
			createTempNavItemObject({
				actionItemParentId: actionItemParent?.documentId,
				entityRoute: row.route,
				selectedNavigation,
				navItemState: {
					title: row.title,
					active: row.route?.active,
					isOverride: row.route?.isOverride,
				},
				selectedEntity: row.entry,
				selectedContentType: row.contentType,
				path: {
					needsUrlCheck: false,
					value: row.path,
					prevValue: '',
					slug: row.slug,
					replacement: null,
					uidPath: '',
					canonicalPath: row.route?.canonicalPath ?? '',
					initialPath: row.route?.path ?? '',
				} satisfies ExtendedPanelPathState,
			}),
		)
		onCreate(newItems)

		setModalType('')
	}

	const titleText = formatMessage({
		id: getTranslation('modal.internalItem.titleText.create'),
		defaultMessage: 'Add new navigation item',
	})
	const closeText = formatMessage({
		id: getTranslation('cancel'),
		defaultMessage: 'Cancel',
	})

	if (availableContentTypes.length === 0) {
		return (
			<NavModal
				confirmText={formatMessage({
					id: getTranslation('add'),
					defaultMessage: 'Add',
				})}
				closeText={closeText}
				titleText={titleText}
				footer={<></>}
			>
				<FullLoader height={50} />
			</NavModal>
		)
	}

	const backButton = (
		<Button variant="tertiary" type="button" onClick={goBack}>
			{formatMessage({
				id: getTranslation('back'),
				defaultMessage: 'Back',
			})}
		</Button>
	)

	if (step === 'review') {
		return (
			<NavModal
				confirmText=""
				closeText={closeText}
				titleText={titleText}
				onConfirm={addReviewedItems}
				footer={
					<>
						{backButton}
						<Button type="submit" disabled={!canAddReviewedItems}>
							{formatMessage(
								{
									id: getTranslation('modal.multiItem.confirm'),
									defaultMessage: 'Add {count, plural, one {# item} other {# items}}',
								},
								{ count: reviewRows.length },
							)}
						</Button>
					</>
				}
			>
				<MultiItemReview
					selectedEntries={selectedEntryList}
					parentNavItem={actionItemParent}
					onRowsChange={setReviewRows}
				/>
			</NavModal>
		)
	}

	if (step === 'details') {
		return (
			<NavModal
				confirmText=""
				closeText={closeText}
				titleText={titleText}
				onConfirm={addItem}
				footer={
					<>
						{backButton}
						<Button
							type="submit"
							disabled={
								!selectedContentType ||
								!entity?.documentId ||
								!path ||
								!path.value?.trim() ||
								!path.slug?.trim() ||
								!navItemState.title ||
								!navItemState.title?.trim() ||
								isBlacklisted ||
								validationState === 'checking'
							}
						>
							{formatMessage({
								id: getTranslation('add'),
								defaultMessage: 'Add',
							})}
						</Button>
					</>
				}
			>
				{loadingRoute || !route ? (
					<FullLoader height={50} />
				) : (
					<ItemDetails
						navItemState={navItemState}
						dispatchNavItemState={dispatchNavItemState}
						path={path}
						dispatchPath={dispatchPath}
						validationState={validationState}
						isBlacklisted={isBlacklisted}
						parentNavItem={actionItemParent}
						navigationItems={navigationItems}
						navigations={navigations}
						debouncedCheckUrl={debouncedCheckUrl}
						cancelUrlCheck={cancelUrlCheck}
						debouncedCheckBlacklist={debouncedCheckBlacklist}
						route={route}
						modalVariant="create"
					/>
				)}
			</NavModal>
		)
	}

	return (
		<NavModal
			confirmText={formatMessage(
				{
					id: getTranslation('modal.entrySelection.next'),
					defaultMessage: 'Next ({count})',
				},
				{ count: selectedEntries.size },
			)}
			closeText={closeText}
			titleText={titleText}
			onConfirm={goToNextStep}
			modalToOpen=""
			currentModalType="ItemCreate"
			currentModalMode="create"
			disabled={selectedEntries.size === 0}
		>
			<Flex direction="column" alignItems="stretch" gap={4}>
				<Box width="100%">
					<Field.Root>
						<Field.Label>
							{formatMessage({
								id: getTranslation('modal.item.navigationPosition.label'),
								defaultMessage: 'Navigation Position',
							})}
						</Field.Label>
						<Field.Input name="navigationPosition" value={positionText || 'Root'} disabled />
					</Field.Root>
				</Box>
				<Divider />
				<EntrySelection
					contentTypes={availableContentTypes}
					contentType={searchContentType}
					setContentType={setSearchContentType}
					query={query}
					setQuery={setQuery}
					selectedEntries={selectedEntries}
					onToggle={toggleEntry}
					onClear={() => setSelectedEntries(new Map())}
					getUsage={(entry) => usageByDocumentId.get(entry.documentId) ?? null}
				/>
			</Flex>
		</NavModal>
	)
}

export const ItemCreate = withModalSharedLogic<ModalItem_VariantCreate>(ItemCreateComponent)
