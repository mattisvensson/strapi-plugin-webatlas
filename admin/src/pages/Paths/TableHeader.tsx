import type { RouteSortKey } from '../../types'
import { Typography, Thead, Tr, Th, VisuallyHidden } from '@strapi/design-system'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'
import { ChevronDown, ChevronUp } from '@strapi/icons'

export default function TableHeader({
	sortKey,
	sortDirection,
	handleSort,
}: {
	sortKey: RouteSortKey
	sortDirection: 'asc' | 'desc'
	handleSort: (key: RouteSortKey) => void
}) {
	const { formatMessage } = useIntl()
	const SortIcon = sortDirection === 'asc' ? ChevronUp : ChevronDown

	return (
		<Thead>
			<Tr>
				<Th onClick={() => handleSort('title')} cursor="pointer">
					<Typography variant="sigma">
						{formatMessage({
							id: getTranslation('title'),
							defaultMessage: 'Title',
						})}
					</Typography>
					{sortKey === 'title' && <SortIcon />}
				</Th>
				<Th onClick={() => handleSort('canonicalPath')} cursor="pointer">
					<Typography variant="sigma">
						{formatMessage({
							id: getTranslation('canonicalPath'),
							defaultMessage: 'Canonical Path',
						})}
					</Typography>
					{sortKey === 'canonicalPath' && <SortIcon />}
				</Th>
				<Th onClick={() => handleSort('path')} cursor="pointer">
					<Typography variant="sigma">
						{formatMessage({
							id: getTranslation('path'),
							defaultMessage: 'Path',
						})}
					</Typography>
					{sortKey === 'path' && <SortIcon />}
				</Th>
				<Th onClick={() => handleSort('type')} cursor="pointer">
					<Typography variant="sigma">
						{formatMessage({
							id: getTranslation('paths.page.column.type'),
							defaultMessage: 'Type',
						})}
					</Typography>
					{sortKey === 'type' && <SortIcon />}
				</Th>
				<Th>
					<VisuallyHidden>
						{formatMessage({
							id: getTranslation('actions'),
							defaultMessage: 'Actions',
						})}
					</VisuallyHidden>
				</Th>
			</Tr>
		</Thead>
	)
}
