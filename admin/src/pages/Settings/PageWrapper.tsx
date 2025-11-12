import { Button, Box } from '@strapi/design-system';
import { Page, Layouts} from '@strapi/strapi/admin'
import { PLUGIN_NAME } from '../../../../pluginId';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import type { ConfigContentType } from '../../../../types';

export default function PageWrapper({ 
  settingsState, 
  initialState, 
  save, 
  isSaving,
  children
}: { 
  settingsState?: any, 
  initialState?: any, 
  save?: () => void, 
  isSaving?: boolean,
  children: React.ReactNode 
}) {

  const { formatMessage } = useIntl();
  
  return (
    <Page.Main>
      <Layouts.Header
        title={PLUGIN_NAME}
        subtitle={formatMessage({
          id: getTranslation('settings.page.subtitle'),
          defaultMessage: 'Settings',
        })}
        primaryAction={ settingsState && initialState && save &&
          <Button
            type="submit"
            onClick={() => save()}
            loading={isSaving}
            disabled={
              JSON.stringify(settingsState) === JSON.stringify(initialState)
              || settingsState.selectedContentTypes.find((cta: ConfigContentType) => !cta.default) !== undefined
              || isSaving
            }
          >
            {formatMessage({
              id: getTranslation('save'),
              defaultMessage: 'Save',
            })}
          </Button>
        }
      />
      <Layouts.Content>
        <Box
          background='neutral0'
          borderColor="neutral150"
          hasRadius
          paddingBottom={4}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={6}
          shadow="tableShadow"
        >
          {children}
        </Box>
      </Layouts.Content>
    </Page.Main>
  )
}