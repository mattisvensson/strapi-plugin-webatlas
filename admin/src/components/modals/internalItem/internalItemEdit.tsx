import type { ModalItem_VariantEdit } from '../../../types'
import { Box, Divider, Grid, Field } from '@strapi/design-system'
import { withModalSharedLogic } from '../withModalSharedLogic'
import { useEffect, useMemo } from 'react'
import { useModalSharedLogic } from '../useModalSharedLogic'
import { NavModal } from '../'
import { useIntl } from 'react-intl'
import { getTranslation, findParentNavItem } from '../../../utils'
import { transformToUrl } from '../../../../../utils'
import ItemDetails from './ItemDetails'

function ItemEditComponent({
	item,
	selectedContentType,
	setSelectedContentType,
	contentTypes,
	validationState,
	isBlacklisted,
	initialState,
	navItemState,
	dispatchNavItemState,
	path,
	dispatchPath,
	debouncedCheckUrl,
	cancelUrlCheck,
	debouncedCheckBlacklist,
	setModalType,
	navigationItems,
	onEdit,
}: ModalItem_VariantEdit & ReturnType<typeof useModalSharedLogic>) {
	const { formatMessage } = useIntl()

	const parentNavItem = useMemo(() => {
		return findParentNavItem({
			navigationItems: navigationItems,
			targetItem: item,
			onlyInternalItems: true,
		})
	}, [navigationItems, item])

	useEffect(() => {
		const parentPath = parentNavItem?.clientModifications?.path || parentNavItem?.route.path || ''
		// Built like in ItemDetails, root items have no leading slash
		const initialPath = parentPath ? `${parentPath}/${item.route.slug}` : item.route.slug

		dispatchPath({ type: 'DEFAULT', payload: initialPath })
		dispatchPath({ type: 'SET_SLUG', payload: item.route.slug })
		dispatchPath({ type: 'SET_INITIALPATH', payload: initialPath })
		dispatchPath({
			type: 'SET_CANONICALPATH',
			payload: item.route.canonicalPath,
		})

		dispatchNavItemState({ type: 'SET_TITLE', payload: item.route.title })
		dispatchNavItemState({ type: 'SET_ACTIVE', payload: item.route.active })
		dispatchNavItemState({
			type: 'SET_OVERRIDE',
			payload: item.route.isOverride,
		})

		const initialValues = {
			title: item.route.title,
			active: item.route.active,
			isOverride: item.route.isOverride,
			slug: item.route.slug,
		}

		initialState.current = initialValues
	}, [navigationItems, item, parentNavItem])

	useEffect(() => {
		const contentType = contentTypes.find(({ uid }) => uid === item.route.relatedContentType)
		if (contentType) setSelectedContentType(contentType)
	}, [contentTypes])

	// Compares only the fields the modal can change, the slug is part of the path. The whole state
	// cannot be compared, it contains fields the initial values do not have (e.g. the type)
	const hasChanges =
		navItemState.title !== initialState.current.title ||
		navItemState.active !== initialState.current.active ||
		navItemState.isOverride !== initialState.current.isOverride ||
		path.value !== path.initialPath

	const updateItem = async () => {
		try {
			if (!hasChanges) return
			// The path is not checked yet
			if (validationState === 'checking') return

			const isOverride = path.value !== item.route.path ? true : navItemState.isOverride

			onEdit({
				...item,
				clientModifications: {
					type: 'update',
					title: navItemState.title,
					slug: transformToUrl(path.slug || ''),
					path: path.value,
					isOverride,
				},
			})
			setModalType('')
		} catch (err) {
			console.error(err)
		}
	}

	if (!selectedContentType) return null

	return (
		<NavModal
			confirmText={formatMessage({
				id: getTranslation('save'),
				defaultMessage: 'Save',
			})}
			closeText={formatMessage({
				id: getTranslation('cancel'),
				defaultMessage: 'Cancel',
			})}
			titleText={`${formatMessage({ id: getTranslation('edit'), defaultMessage: 'Edit' })} ${selectedContentType.label} "${item.route.title}"`}
			loadingText={formatMessage({
				id: getTranslation('modal.internalItem.loadingText.edit'),
				defaultMessage: 'Saving',
			})}
			onConfirm={updateItem}
			modalToOpen=""
			currentModalType="ItemCreate"
			currentModalMode="edit"
			disabled={!hasChanges || isBlacklisted || validationState === 'checking'}
		>
			<Grid.Root gap={8}>
				<Grid.Item col={6} s={12}>
					<Box width="100%">
						<Field.Root>
							<Field.Label>
								{formatMessage({
									id: getTranslation('modal.internalItem.contentType.label'),
									defaultMessage: 'Content Type',
								})}
							</Field.Label>
							<Field.Input value={selectedContentType.label} disabled />
						</Field.Root>
					</Box>
				</Grid.Item>
				<Grid.Item col={6} s={12}>
					<Box width="100%">
						<Field.Root>
							<Field.Label>
								{formatMessage({
									id: getTranslation('modal.internalItem.entity.label'),
									defaultMessage: 'Entity',
								})}
							</Field.Label>
							<Field.Input value={`${item.route.relatedId} - ${item.route.title}`} disabled />
						</Field.Root>
					</Box>
				</Grid.Item>
			</Grid.Root>
			{item && (
				<>
					<Box paddingBottom={6} paddingTop={6}>
						<Divider />
					</Box>
					<ItemDetails
						navItemState={navItemState}
						dispatchNavItemState={dispatchNavItemState}
						path={path}
						dispatchPath={dispatchPath}
						validationState={validationState}
						isBlacklisted={isBlacklisted}
						parentNavItem={parentNavItem}
						navigationItems={navigationItems}
						debouncedCheckUrl={debouncedCheckUrl}
						cancelUrlCheck={cancelUrlCheck}
						debouncedCheckBlacklist={debouncedCheckBlacklist}
						item={item}
						route={item.route}
						modalVariant="edit"
					/>
				</>
			)}
		</NavModal>
	)
}
export const ItemEdit = withModalSharedLogic<ModalItem_VariantEdit>(ItemEditComponent)
