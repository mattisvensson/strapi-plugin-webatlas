import { Layouts, Page } from '@strapi/strapi/admin';
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
        <>
          {children}
        </>
      </Layouts.Content>
    </Page.Main>
  );
}