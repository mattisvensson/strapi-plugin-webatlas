import { Grid, Box, Field } from '@strapi/design-system'
import { withModalSharedLogic } from '../withModalSharedLogic'
import { NestedNavItem } from '../../../../../types'
import { useModalSharedLogic } from '../useModalSharedLogic'
import React, { useEffect } from 'react'
import { NavModal } from '../'
import { useIntl } from 'react-intl'
import { getTranslation, createTempNavItemObject } from '../../../utils'

type externalCreateProps = {
	variant: 'ExternalCreate'
	actionItemParentId?: string
	onCreate: (newItem: NestedNavItem) => void
}

type externalEditProps = {
	variant: 'ExternalEdit'
	item: NestedNavItem
	onSave: (editedItem: NestedNavItem) => void
}

type externalItemProps = externalCreateProps | externalEditProps

function isExternalEditProps(props: externalItemProps): props is externalEditProps {
	return props.variant === 'ExternalEdit'
}
function isExternalCreateProps(props: externalItemProps): props is externalCreateProps {
	return props.variant === 'ExternalCreate'
}

function ExternalItemComponent(props: externalItemProps & ReturnType<typeof useModalSharedLogic>) {
	const {
		variant,
		navItemState,
		dispatchNavItemState,
		path,
		dispatchPath,
		setModalType,
		selectedNavigation,
	} = props

	const actionItemParentId = isExternalCreateProps(props) ? props.actionItemParentId : undefined
	const onCreate = isExternalCreateProps(props) ? props.onCreate : undefined
	const onSave = isExternalEditProps(props) ? props.onSave : undefined
	const item = isExternalEditProps(props) ? props.item : undefined

	const { formatMessage } = useIntl()

	// The current state of the item, including changes that are not saved yet. An edited URL is
	// stored as slug of the client modifications
	const currentTitle = item?.clientModifications?.title || item?.route.title
	const currentUrl = item?.clientModifications?.slug || item?.route.path

	useEffect(() => {
		if (variant !== 'ExternalEdit' || !item) return

		dispatchNavItemState({ type: 'SET_TITLE', payload: currentTitle ?? '' })
		dispatchNavItemState({ type: 'SET_ACTIVE', payload: item.route.active })
		dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: currentUrl ?? '' })
	}, [variant, item, dispatchNavItemState, dispatchPath])

	// When editing, saving is only possible once the title or the URL differ from the initial values
	const hasChanges =
		variant !== 'ExternalEdit' ||
		!item ||
		navItemState.title !== currentTitle ||
		path.value !== currentUrl

	const handleConfirm = async () => {
		try {
			if (
				!path ||
				path.value?.trim() === '' ||
				!navItemState.title ||
				navItemState.title?.trim() === '' ||
				!selectedNavigation ||
				!hasChanges
			)
				return

			// A new item is created from its route when saving, so its changes go there and it stays new
			if (
				variant === 'ExternalEdit' &&
				item &&
				onSave &&
				item.clientModifications?.type === 'create'
			) {
				onSave({
					...item,
					route: {
						...item.route,
						title: navItemState.title ?? item.route.title,
						path: path.value ?? item.route.path,
					},
				})
			} else if (variant === 'ExternalEdit' && item && onSave) {
				onSave({
					...item,
					clientModifications: {
						...item.clientModifications,
						type: 'update',
						title: navItemState.title,
						slug: path.value,
					},
				})
			} else if (onCreate) {
				const newItem = createTempNavItemObject({
					actionItemParentId,
					entityRoute: null,
					selectedNavigation,
					navItemState,
					selectedEntity: null,
					selectedContentType: null,
					path,
					type: 'external',
				})
				onCreate(newItem)
			}

			setModalType('')
		} catch (err) {
			console.error(err)
		}
	}

	return (
		<NavModal
			confirmText={
				variant === 'ExternalCreate'
					? formatMessage({ id: getTranslation('add'), defaultMessage: 'Add' })
					: formatMessage({
							id: getTranslation('save'),
							defaultMessage: 'Save',
						})
			}
			closeText={formatMessage({
				id: getTranslation('cancel'),
				defaultMessage: 'Cancel',
			})}
			titleText={
				variant === 'ExternalCreate'
					? formatMessage({
							id: getTranslation('modal.externalItem.titleText.create'),
							defaultMessage: 'Create new external item',
						})
					: formatMessage({
							id: getTranslation('modal.externalItem.titleText.edit'),
							defaultMessage: `Edit external path "${navItemState.title}"`,
						})
			}
			loadingText={
				variant === 'ExternalCreate'
					? formatMessage({
							id: getTranslation('modal.externalItem.loadingText.create'),
							defaultMessage: 'Adding',
						})
					: formatMessage({
							id: getTranslation('modal.externalItem.loadingText.edit'),
							defaultMessage: 'Saving',
						})
			}
			onConfirm={handleConfirm}
			modalToOpen=""
			currentModalType="ExternalCreate"
			currentModalMode={variant === 'ExternalCreate' ? 'create' : 'edit'}
			disabled={
				!path ||
				!path.value?.trim() ||
				!navItemState.title ||
				!navItemState.title?.trim() ||
				!hasChanges
			}
		>
			<Grid.Root gap={8}>
				<Grid.Item col={6} s={12}>
					<Box width="100%">
						<Field.Root>
							<Field.Label>
								{formatMessage({
									id: getTranslation('modal.item.titleField.label'),
									defaultMessage: 'Title',
								})}
							</Field.Label>
							<Field.Input
								placeholder={formatMessage({
									id: getTranslation('modal.item.titleField.placeholder'),
									defaultMessage: 'e.g. About us',
								})}
								name="title"
								value={navItemState.title || ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									dispatchNavItemState({
										type: 'SET_TITLE',
										payload: e.target.value,
									})
								}
								required
							/>
						</Field.Root>
					</Box>
				</Grid.Item>
				<Grid.Item col={6} s={12}>
					<Box width="100%">
						<Field.Root>
							<Field.Label>
								{formatMessage({
									id: getTranslation('modal.item.pathField.label'),
									defaultMessage: 'Path',
								})}
							</Field.Label>
							<Field.Input
								required
								placeholder={formatMessage({
									id: getTranslation('modal.externalItem.pathField.placeholder'),
									defaultMessage: 'e.g. https://example.com',
								})}
								name="slug"
								value={path?.value || ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									dispatchPath({
										type: 'NO_TRANSFORM_AND_CHECK',
										payload: e.target.value,
									})
								}
							/>
						</Field.Root>
					</Box>
				</Grid.Item>
			</Grid.Root>
		</NavModal>
	)
}

export const ExternalItem = withModalSharedLogic<externalItemProps>(ExternalItemComponent)
