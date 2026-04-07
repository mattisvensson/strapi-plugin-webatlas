import type { NestedNavItem } from '../../../../types';
import { Typography, Badge } from '@strapi/design-system';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export default function RouteItemBadge({ item }: { item: NestedNavItem }) {
  if (item.route.type !== 'internal' || !item.status) return null;

  const { formatMessage } = useIntl();

  const itemStatusOptions = {
    published: {
      status: formatMessage({
        id: getTranslation('published'),
        defaultMessage: 'Published',
      }),
      backgroundColor: 'success100',
      textColor: 'success600',
      borderColor: 'success200',
    },
    draft: {
      status: formatMessage({
        id: getTranslation('draft'),
        defaultMessage: 'Draft',
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
      backgroundColor: 'alternative100',
      textColor: 'alternative600',
      borderColor: 'alternative200',
    }
  }

  return <Badge
      backgroundColor={itemStatusOptions[item.status].backgroundColor}
      textColor={itemStatusOptions[item.status].textColor}
      borderColor={itemStatusOptions[item.status].borderColor}
    >
      <Typography fontWeight="bold">
        {itemStatusOptions[item.status].status}
      </Typography>
    </Badge>

}
