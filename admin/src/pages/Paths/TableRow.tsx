import type { Route } from '../../../../types'
import { Typography, Tr, Td, Flex, LinkButton, Badge } from '@strapi/design-system'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'
import { Pencil } from '@strapi/icons'
import Tooltip from '../../components/Tooltip'
import hasPathDeviation from './hasPathDeviation'

export default function TableRow({ route, isSingleType }: { route: Route; isSingleType: boolean }) {
	const { formatMessage } = useIntl()
	const hasDeviation = hasPathDeviation(route)

	return (
		<Tr>
			<Td>
				<Typography title={route.title} textColor="neutral800">
					{route.title || '-'}
				</Typography>
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
				<Typography title={route.type} textColor="neutral800">
					{formatMessage({
						id: getTranslation(`path.type.${route.type}`),
						defaultMessage: '-',
					})}
				</Typography>
			</Td>
			<Td>
				<Flex gap={2} justifyContent="end">
					{route.type === 'internal' && (
						<LinkButton
							variant="secondary"
							startIcon={<Pencil />}
							href={
								isSingleType
									? `/admin/content-manager/single-types/${route.relatedContentType}`
									: `/admin/content-manager/collection-types/${route.relatedContentType}/${route.relatedDocumentId}`
							}
						>
							{formatMessage({
								id: getTranslation('edit'),
								defaultMessage: 'Edit',
							})}
						</LinkButton>
					)}
				</Flex>
			</Td>
		</Tr>
	)
}
