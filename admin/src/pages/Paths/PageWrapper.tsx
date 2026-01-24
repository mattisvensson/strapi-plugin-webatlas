import { Layouts, Page } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const { formatMessage } = useIntl();

  return (
    <Page.Main>
      <Layouts.Header
        title={formatMessage({
          id: getTranslation('paths.page.title'),
          defaultMessage: 'Paths',
        })}
        subtitle={formatMessage({
          id: getTranslation('paths.page.subtitle'),
          defaultMessage: 'Overview of all existing paths',
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