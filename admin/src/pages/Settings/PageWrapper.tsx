import { Button, Flex } from '@strapi/design-system';
import { Page, Layouts} from '@strapi/strapi/admin'
import { PLUGIN_NAME } from '../../../../utils/pluginId';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { Check } from '@strapi/icons';

export default function PageWrapper({ 
  save, 
  isSaving,
  disabledCondition,
  subtitle,
  children
}: {
  save?: () => void, 
  isSaving: boolean,
  disabledCondition: boolean,
  subtitle: string,
  children: React.ReactNode 
}) {

  const { formatMessage } = useIntl();
  
  return (
    <Page.Main>
      <Layouts.Header
        title={PLUGIN_NAME}
        subtitle={subtitle}
        primaryAction={ disabledCondition !== undefined && save &&
          <Button
            type="submit"
            onClick={() => save()}
            loading={isSaving}
            disabled={disabledCondition || isSaving}
            startIcon={<Check />}
          >
            {/* <Check /> */}
            {formatMessage({
              id: getTranslation('save'),
              defaultMessage: 'Save',
            })}
          </Button>
        }
      />
      <Layouts.Content>
        <Flex direction="column" alignItems="stretch" gap={6}>
          {children}
        </Flex>
      </Layouts.Content>
    </Page.Main>
  )
}