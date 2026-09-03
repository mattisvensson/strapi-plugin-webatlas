import type { Route, NestedNavItem, NestedNavigation } from '../../../../../types'
import type { ModalItem_VariantCreate } from '../../../types'
import { Box, Grid, Field } from '@strapi/design-system'
import PathInfo from '../../PathInfo'
import { useEffect, useMemo } from 'react'
import { useModalSharedLogic } from '../useModalSharedLogic'
import { useIntl } from 'react-intl'
import { buildBreadcrumbString, getTranslation } from '../../../utils'
import Tooltip from '../../Tooltip'
import { WarningBox } from '../../UI'

type ItemDetailsProps = Pick<
	ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>,
	| 'navItemState'
	| 'dispatchNavItemState'
	| 'path'
	| 'dispatchPath'
	| 'validationState'
	| 'isBlacklisted'
	| 'debouncedCheckUrl'
	| 'debouncedCheckBlacklist'
> & {
	route: Route
	parentNavItem?: NestedNavItem | null
	navigationItems?: NestedNavItem[] | null
	navigations?: NestedNavigation[] | null
	item?: NestedNavItem
	modalVariant: 'create' | 'edit'
}

export default function ItemDetails({
	navItemState,
	dispatchNavItemState,
	path,
	dispatchPath,
	validationState,
	isBlacklisted,
	parentNavItem,
	navigationItems,
	navigations,
	debouncedCheckUrl,
	debouncedCheckBlacklist,
	item,
	route,
	modalVariant,
}: ItemDetailsProps) {
	const { formatMessage } = useIntl()

	const breadcrumbString = useMemo(() => {
		if (!navigationItems) return null
		const targetItem = item || parentNavItem
		if (!targetItem || typeof targetItem.depth !== 'number') return null
		return buildBreadcrumbString({
			navigationItems: navigationItems,
			targetItem: targetItem,
			includeTarget: modalVariant === 'create',
		})
	}, [parentNavItem, navigationItems, item, modalVariant])

	const navigationWhereRouteExists = useMemo(() => {
		if (!navigations || !route) return false
		return navigations.find((nav) =>
			nav.items.some(
				(r) =>
					r.route.documentId === route.documentId ||
					(r.route.relatedContentType === route.relatedContentType &&
						r.route.relatedDocumentId === route.relatedDocumentId),
			),
		)
	}, [navigations, route, navigationItems])

	useEffect(() => {
		if (path.needsUrlCheck && path.value) {
			if (path.uidPath === path.value || path.initialPath === path.value) return
			debouncedCheckUrl({
				url: path.value,
				routeDocumentId: route.documentId,
				withoutTransform: true,
			})
			dispatchPath({ type: 'SET_URL_CHECK_FLAG' })
		}
	}, [path.needsUrlCheck, route.documentId])

	// Unlike the duplicate check, this has to run on every path change: an unchanged path can become
	// blocked by an edited slug or by moving the item to a different parent
	useEffect(() => {
		debouncedCheckBlacklist({ url: path.value || '' })
	}, [path.value])

	useEffect(() => {
		if (!path.slug) return

		const parentPath = parentNavItem?.clientModifications?.path || parentNavItem?.route.path || ''
		const newPath = parentPath ? `${parentPath}/${path.slug}` : path.slug

		dispatchPath({ type: 'DEFAULT', payload: newPath })
	}, [path.slug, parentNavItem])

	return (
		<Grid.Root gap={4}>
			{path.canonicalPath !== path.value && (
				<Grid.Item col={12} s={12} alignItems="baseline">
					<WarningBox
						title={formatMessage({
							id: getTranslation('modal.item.canonicalPathMismatch'),
							defaultMessage: 'Warning: Canonical Path does not match navigation path',
						})}
					/>
				</Grid.Item>
			)}
			{navigationWhereRouteExists && (
				<Grid.Item col={12} s={12} alignItems="baseline">
					<WarningBox
						title={formatMessage(
							{
								id: getTranslation('modal.item.routeAlreadyUsed'),
								defaultMessage:
									'Warning: This route is already used in the navigation "{navigationName}"',
							},
							{
								navigationName: navigationWhereRouteExists.name,
							},
						)}
						description={formatMessage({
							id: getTranslation('modal.item.routeAlreadyUsed.info'),
							defaultMessage:
								'Changing the path for this item will also update the path in the existing item.',
						})}
					/>
				</Grid.Item>
			)}
			<Grid.Item col={12} s={12} alignItems="baseline">
				<Box width="100%">
					<Field.Root required>
						<Field.Label>
							{formatMessage({
								id: getTranslation('modal.item.titleField.label'),
								defaultMessage: 'Title',
							})}
						</Field.Label>
						<Field.Input
							name="title"
							value={navItemState?.title || ''}
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
			<Grid.Item col={6} s={12} alignItems="baseline">
				<Box width="100%">
					<Field.Root>
						<Field.Label>
							{formatMessage({
								id: getTranslation('modal.item.canonicalPathField.label'),
								defaultMessage: 'Canonical Path',
							})}
							<Tooltip
								description={formatMessage({
									id: getTranslation('modal.item.canonicalPathField.tooltip'),
									defaultMessage: 'Based on content hierarchy',
								})}
							/>
						</Field.Label>
						<Field.Input name="canonicalPath" value={route.canonicalPath || ''} disabled />
						<Field.Hint />
					</Field.Root>
				</Box>
			</Grid.Item>
			<Grid.Item col={6} s={12} alignItems="baseline">
				<Box width="100%">
					<Field.Root required>
						<Field.Label>
							{formatMessage({
								id: getTranslation('modal.item.slugField.label'),
								defaultMessage: 'Slug',
							})}
						</Field.Label>
						<Field.Input
							name="slug"
							value={path.slug}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								dispatchPath({ type: 'SET_SLUG', payload: e.target.value })
							}
							onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
								dispatchPath({ type: 'SET_SLUG', payload: e.target.value })
							}}
						/>
					</Field.Root>
				</Box>
			</Grid.Item>
			<Grid.Item col={6} s={12} alignItems="baseline">
				<Box width="100%">
					<Field.Root>
						<Field.Label>
							{formatMessage({
								id: getTranslation('modal.item.navigationPosition.label'),
								defaultMessage: 'Navigation Position',
							})}
						</Field.Label>
						<Field.Input name="navigationPosition" value={breadcrumbString || 'Root'} disabled />
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
						<Field.Input name="path" value={path.value} disabled />
					</Field.Root>
					<PathInfo
						validationState={validationState}
						replacement={path.replacement}
						isBlacklisted={isBlacklisted}
					/>
				</Box>
			</Grid.Item>
		</Grid.Root>
	)
}
