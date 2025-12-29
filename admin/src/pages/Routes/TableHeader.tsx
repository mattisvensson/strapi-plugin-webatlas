import type { RouteSortKey } from '../../../../types';
import { Typography, Thead, Tr, Th, VisuallyHidden } from '@strapi/design-system';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { ChevronDown } from '@strapi/icons';

export default function TableHeader({
  sortKey,
  handleSort
}: {
  sortKey: RouteSortKey,
  handleSort: (key: RouteSortKey) => void
}) {
  const { formatMessage } = useIntl();

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
          {sortKey === 'title' && <ChevronDown />}
        </Th>
        <Th onClick={() => handleSort('fullPath')} cursor="pointer">
          <Typography variant="sigma">
            {formatMessage({
              id: getTranslation('route'),
              defaultMessage: 'Route',
            })}
          </Typography>
          {sortKey === 'fullPath' && <ChevronDown />}
        </Th>
        <Th onClick={() => handleSort('type')} cursor="pointer">
          <Typography variant="sigma">
            {formatMessage({
              id: getTranslation('routes.page.column.type'),
              defaultMessage: 'Type',
            })}
          </Typography>
          {sortKey === 'type' && <ChevronDown />}
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