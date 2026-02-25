import type { NestedNavItem } from '../../../../types';
import { Typography, Badge } from '@strapi/design-system';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export default function RouteItemStatus({ item }: { item: NestedNavItem }) {
  if (!item) return null;

  const { formatMessage } = useIntl();

  if (item.isNew && !item.deleted)
    return <Badge
        backgroundColor="success100"
        textColor="success600"
        borderColor="success200"
      >
        <Typography fontWeight="bold">
          {formatMessage({
            id: getTranslation('new'),
            defaultMessage: 'New',
          })}
        </Typography>
      </Badge>

  if (item.update && !item.deleted)
      return <Badge
        backgroundColor="warning100"
        textColor="warning600"
        borderColor="warning200"
      >
        <Typography fontWeight="bold">
          {formatMessage({
            id: getTranslation('updated'),
            defaultMessage: 'Updated',
          })}
        </Typography>
      </Badge>

  if (item.deleted)
      return <Badge
        backgroundColor="danger100"
        textColor="danger600"
        borderColor="danger200"
      >
        <Typography fontWeight="bold">
          {formatMessage({
            id: getTranslation('deleted'),
            defaultMessage: 'Deleted',
          })}
        </Typography>
      </Badge>

  return null;
}
