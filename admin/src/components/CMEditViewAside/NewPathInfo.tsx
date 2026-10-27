import { Typography } from '@strapi/design-system'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../utils'

function NewPathInfo({
	hasSlug,
	routeSourceField,
}: {
	hasSlug: boolean
	routeSourceField?: string | null
}) {
	const { formatMessage } = useIntl()

	if (!hasSlug)
		return (
			<Typography textColor="danger600">
				{formatMessage(
					{
						id: getTranslation('components.CMEditViewAside.path.noPathInfo'),
						defaultMessage:
							'No path will be created while the "{field}" field is empty. Fill it in or use the override option to set a custom path.',
					},
					{ field: routeSourceField },
				)}
			</Typography>
		)

	return (
		<Typography textColor="neutral600">
			{formatMessage({
				id: getTranslation('components.CMEditViewAside.path.newPathInfo'),
				defaultMessage: 'A new path will be created upon saving this entry.',
			})}
		</Typography>
	)
}

export default NewPathInfo
