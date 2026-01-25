import { Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

function NewPathInfo() {
  const { formatMessage } = useIntl();

  return (
    <Typography textColor="neutral600">
      {formatMessage({
        id: getTranslation('components.CMEditViewAside.path.newPathInfo'),
        defaultMessage: 'A new path will be created upon saving this entry.',
      })}
    </Typography>
  )
}

export default NewPathInfo;