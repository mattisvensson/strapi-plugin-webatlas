import { Typography, Thead, Tr, Th, VisuallyHidden } from '@strapi/design-system';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export default function TableHeader() {
  const { formatMessage } = useIntl();

  return (
    <Thead>
      <Tr>
        <Th>
          <Typography variant="sigma">ID</Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {formatMessage({
              id: getTranslation('title'),
              defaultMessage: 'Title',
            })}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {formatMessage({
              id: getTranslation('route'),
              defaultMessage: 'Route',
            })}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {formatMessage({
              id: getTranslation('routes.page.column.type'),
              defaultMessage: 'Type',
            })}
          </Typography>
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