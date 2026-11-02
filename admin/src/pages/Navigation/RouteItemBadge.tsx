import type { NestedNavItem } from '../../../../types'
import { Typography, Badge, Tooltip, Box } from '@strapi/design-system'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'

export default function RouteItemBadge({ item }: { item: NestedNavItem }) {
	const { formatMessage } = useIntl()

	if (item.route.type !== 'internal' || !item.status) return null

	const itemStatusOptions = {
		published: {
			status: formatMessage({
				id: getTranslation('published'),
				defaultMessage: 'Published',
			}),
			hint: null,
			backgroundColor: 'success100',
			textColor: 'success600',
			borderColor: 'success200',
		},
		draft: {
			status: formatMessage({
				id: getTranslation('draft'),
				defaultMessage: 'Draft',
			}),
			// Unpublished pages are removed from the navigation in the frontend
			hint: formatMessage({
				id: getTranslation('navigation.page.navItem.draftHint'),
				defaultMessage: 'Only shown in the frontend once the page is published.',
			}),
			backgroundColor: 'secondary100',
			textColor: 'secondary600',
			borderColor: 'secondary200',
		},
		modified: {
			status: formatMessage({
				id: getTranslation('modified'),
				defaultMessage: 'Modified',
			}),
			hint: formatMessage({
				id: getTranslation('navigation.page.navItem.modifiedHint'),
				defaultMessage: 'The latest changes of the page are not published yet.',
			}),
			backgroundColor: 'alternative100',
			textColor: 'alternative600',
			borderColor: 'alternative200',
		},
	}

	const { status, hint, ...colors } = itemStatusOptions[item.status]
	const badge = (
		<Badge {...colors} size="S">
			<Typography fontWeight="bold">{status}</Typography>
		</Badge>
	)

	// Badge does not forward refs, the tooltip needs one to find and position its trigger
	return hint ? (
		<Tooltip label={hint}>
			<Box tag="span" display="inline-flex">
				{badge}
			</Box>
		</Tooltip>
	) : (
		badge
	)
}
