import type { Route } from '../../../../types'
import { SimpleMenu, MenuItem, IconButton } from '@strapi/design-system'
import { More } from '@strapi/icons'
import { useNavigate } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../utils'
import { PLUGIN_ID } from '../../../../utils'
import { useClipboard, useNotification } from '@strapi/strapi/admin'

// The navigation page highlights the item and expands its parents
const getNavigationPath = (navigationDocumentId: string, navItemDocumentId: string) =>
	`/plugins/${PLUGIN_ID}/navigation/${navigationDocumentId}?highlight=${encodeURIComponent(navItemDocumentId)}`

// The path of an external route is user input. Only http(s) URLs are linked, so for example a
// javascript: URL can never be executed by clicking the menu item
function getSafeExternalUrl(path: string) {
	try {
		const url = new URL(path)
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
	} catch {
		return null
	}
}

export default function PathActionsMenu({
	route,
	isSingleType,
}: {
	route: Route
	isSingleType: boolean
}) {
	const { formatMessage } = useIntl()
	const navigate = useNavigate()
	const { copy } = useClipboard()
	const { toggleNotification } = useNotification()

	const handleCopyPath = async () => {
		const success = await copy(route.path)
		toggleNotification({
			type: success ? 'success' : 'danger',
			message: success
				? formatMessage({
						id: getTranslation('notification.paths.pathCopied'),
						defaultMessage: 'Path copied',
					})
				: formatMessage({
						id: getTranslation('notification.paths.pathCopyFailed'),
						defaultMessage: 'Path could not be copied',
					}),
		})
	}

	const editPath =
		route.type === 'internal'
			? isSingleType
				? `/content-manager/single-types/${route.relatedContentType}`
				: `/content-manager/collection-types/${route.relatedContentType}/${route.relatedDocumentId}`
			: null
	const externalUrl = route.type === 'external' ? getSafeExternalUrl(route.path) : null

	// A route can be used in several navigations (e.g. main menu and footer), each is listed once
	// with its first item, which is highlighted there
	const navigationsById = new Map<
		string,
		{ documentId: string; name: string; navItemDocumentId: string }
	>()
	for (const item of route.navitem ?? []) {
		if (item.navigation && !navigationsById.has(item.navigation.documentId)) {
			navigationsById.set(item.navigation.documentId, {
				...item.navigation,
				navItemDocumentId: item.documentId,
			})
		}
	}
	const navigations = [...navigationsById.values()]

	// No menu without actions, e.g. for a wrapper route that is in no navigation
	if (!editPath && !externalUrl && !route.path && navigations.length === 0) return null

	return (
		<SimpleMenu
			label={formatMessage({
				id: getTranslation('paths.page.actions'),
				defaultMessage: 'Path actions',
			})}
			tag={IconButton}
			icon={<More />}
		>
			{editPath && (
				<MenuItem onClick={() => navigate(editPath)}>
					{formatMessage({
						id: getTranslation('edit'),
						defaultMessage: 'Edit',
					})}
				</MenuItem>
			)}
			{externalUrl && (
				<MenuItem isExternal href={externalUrl}>
					{formatMessage({
						id: getTranslation('paths.page.action.openLink'),
						defaultMessage: 'Open link',
					})}
				</MenuItem>
			)}
			{route.path && (
				<MenuItem onClick={handleCopyPath}>
					{formatMessage({
						id: getTranslation('paths.page.action.copyPath'),
						defaultMessage: 'Copy path',
					})}
				</MenuItem>
			)}
			{navigations.map((navigation) => (
				<MenuItem
					key={navigation.documentId}
					onClick={() =>
						navigate(getNavigationPath(navigation.documentId, navigation.navItemDocumentId))
					}
				>
					{navigations.length === 1
						? formatMessage({
								id: getTranslation('paths.page.action.showInNavigation'),
								defaultMessage: 'Show in navigation',
							})
						: formatMessage(
								{
									id: getTranslation('paths.page.action.showInNamedNavigation'),
									defaultMessage: 'Show in navigation "{name}"',
								},
								{ name: navigation.name },
							)}
				</MenuItem>
			))}
		</SimpleMenu>
	)
}
