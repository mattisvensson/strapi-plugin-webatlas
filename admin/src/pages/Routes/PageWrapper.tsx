import { Layouts, Page } from '@strapi/strapi/admin';
import { Box } from '@strapi/design-system';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const { formatMessage } = useIntl();

  return (
    <Page.Main>
      <Layouts.Header
        title={formatMessage({
          id: getTranslation('routes.page.title'),
          defaultMessage: 'Routes',
        })}
        subtitle={formatMessage({
          id: getTranslation('routes.page.subtitle'),
          defaultMessage: 'Overview of all existing routes',
        })}
      />
      <Layouts.Content>
        <Box>
          {children}
        </Box>
      </Layouts.Content>
    </Page.Main>
  );
}