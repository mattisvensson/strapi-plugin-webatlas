import { Box, Divider, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

function NewPathInfo() {
  const { formatMessage } = useIntl();

  return (
    <>
      <Typography textColor="neutral600" marginBottom={2}>
        {formatMessage({
          id: getTranslation('components.CMEditViewAside.path.newPathInfo'),
          defaultMessage: 'A new path will be created upon saving this entry.',
        })}
      </Typography>
      <Box paddingBottom={2} paddingTop={2}>
        <Divider/>
      </Box>
    </>
  )
}

export default NewPathInfo;