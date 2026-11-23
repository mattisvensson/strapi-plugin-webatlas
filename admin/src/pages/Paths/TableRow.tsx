import type { HealthIssue, Route } from '../../../../types'
import { Typography, Tr, Td, Flex, Badge } from '@strapi/design-system'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'
import Tooltip from '../../components/Tooltip'
import hasPathDeviation from './hasPathDeviation'
import PathActionsMenu from './PathActionsMenu'
import IssueBadges from './IssueBadges'

export default function TableRow({
	route,
	isSingleType,
	contentTypeLabel,
	issues,
	canReadNavigation,
	canEdit,
}: {
	route: Route
	isSingleType: boolean
	contentTypeLabel?: string
	issues?: HealthIssue[]
	canReadNavigation: boolean
	canEdit: boolean
}) {
	const { formatMessage } = useIntl()
	const hasDeviation = hasPathDeviation(route)

	return (
		<Tr>
			<Td>
				<Flex alignItems="flex-start" gap={2}>
					<Typography title={route.title} textColor="neutral800">
						{route.title || '-'}
					</Typography>
					{issues && issues.length > 0 && <IssueBadges issues={issues} />}
				</Flex>
			</Td>
			<Td>
				<Flex direction="column" alignItems="flex-start" gap={1}>
					<Flex gap={2}>
						<Typography title={route.path} textColor="neutral800">
							{route.path || '-'}
						</Typography>
						{/* isOverride is set for every deviation, so the cause (navigation or manual override) is not known */}
						{hasDeviation && (
							<>
								<Badge
									backgroundColor="secondary100"
									textColor="secondary600"
									borderColor="secondary200"
								>
									{formatMessage({
										id: getTranslation('paths.page.deviation'),
										defaultMessage: 'Differs',
									})}
								</Badge>
								<Tooltip
									description={formatMessage({
										id: getTranslation('paths.page.deviation.description'),
										defaultMessage:
											'The path differs from the content structure, due to the position in the navigation or a manual override',
									})}
								/>
							</>
						)}
					</Flex>
					{hasDeviation && (
						<Typography title={route.canonicalPath} variant="pi" textColor="neutral600">
							↳{' '}
							{formatMessage(
								{
									id: getTranslation('paths.page.canonicalPathHint'),
									defaultMessage: 'Canonical Path: {path}',
								},
								{ path: route.canonicalPath },
							)}
						</Typography>
					)}
				</Flex>
			</Td>
			<Td>
				{/* External and wrapper routes have no content type */}
				<Typography title={route.relatedContentType} textColor="neutral800">
					{contentTypeLabel || '-'}
				</Typography>
			</Td>
			<Td>
				<Typography title={route.type} textColor="neutral800">
					{formatMessage({
						id: getTranslation(`path.type.${route.type}`),
						defaultMessage: '-',
					})}
				</Typography>
			</Td>
			<Td>
				<Flex justifyContent="end">
					<PathActionsMenu
						route={route}
						isSingleType={isSingleType}
						canReadNavigation={canReadNavigation}
						canEdit={canEdit}
					/>
				</Flex>
			</Td>
		</Tr>
	)
}
