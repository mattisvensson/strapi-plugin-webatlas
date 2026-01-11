/*
 *
 * Settings
 * This file contains the navigation settings page for the Webatlas plugin.
 * It allows users to set the max depth of the navigation tree.
 *
*/

import { useEffect, useState, useReducer, useRef } from 'react';
import { Field } from '@strapi/design-system';
import { useNotification, Page } from '@strapi/strapi/admin'
import usePluginConfig from '../../../hooks/usePluginConfig';
import type { PluginConfig } from '../../../../../types';
import { getTranslation } from '../../../utils';
import { useIntl } from 'react-intl';
import { FullLoader } from '../../../components/UI';
import { PageWrapper, ContentBox, SettingTitle } from '../';
import pluginPermissions from '../../../permissions';

type Action =
  | { type: 'SET_MAX_DEPTH'; payload: number }
  | { type: 'SET_CONFIG'; payload: PluginConfig }

function reducer(newConfig: PluginConfig | null, action: Action): PluginConfig | null {
  switch (action.type) {
    case 'SET_MAX_DEPTH':
      if (!newConfig) return null;
      return { 
        ...newConfig, 
        navigation: { ...newConfig.navigation, maxDepth: action.payload },
        selectedContentTypes: newConfig.selectedContentTypes || []
      };
    case 'SET_CONFIG':
      return action.payload;
    default:
      throw new Error();
  }
}

const Settings = () => {
  const { config: fetchedConfig, setConfig, loading, fetchError } = usePluginConfig();
  const [config, dispatch] = useReducer(reducer, fetchedConfig);
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const [isSaving, setIsSaving] = useState(false);
  const initialConfig = useRef<PluginConfig | null>(fetchedConfig);

  useEffect(() => {
    initialConfig.current = fetchedConfig;

    if (fetchedConfig)
      dispatch({ type: 'SET_CONFIG', payload: fetchedConfig });
  }, [fetchedConfig]);

  useEffect(() => {
    if (fetchError) {
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('notification.error'),
          defaultMessage: 'An error occurred',
        }) + ': ' + fetchError,
      });
    }
  }, [fetchError, toggleNotification, formatMessage]);

  async function save() {
    if (!config) return

    setIsSaving(true);
    try {
      await setConfig({ navigation: config.navigation })
      initialConfig.current = config;

      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('notification.settings.saved'),
          defaultMessage: 'Settings saved successfully',
        }),
      });
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('notification.error'),
          defaultMessage: 'An error occurred',
        }) + ': ' + err,
      });
      console.error(err);
    }
  }

  if (loading) {
    return <PageWrapper
      isSaving={isSaving}
      subtitle={formatMessage({
        id: getTranslation('loading'),
        defaultMessage: 'Loading...',
      })}
      disabledCondition={true}
    >
      <FullLoader height={200} />
    </PageWrapper>
  }

  return (
    <Page.Protect permissions={pluginPermissions['settings.navigation']}>
      <PageWrapper
        save={save}
        isSaving={isSaving}
        subtitle={formatMessage({
          id: getTranslation('settings.page.navigation.subtitle'),
          defaultMessage: 'Configure navigation settings',
        })}
        disabledCondition={JSON.stringify(config) === JSON.stringify(initialConfig.current)}
      >
        <ContentBox title={formatMessage({
          id: getTranslation('settings.page.navigation.navigation'),
          defaultMessage: 'Navigation',
        })}>
          <Field.Root name="maxNavDepth">
            <Field.Label>
              <SettingTitle>
                {formatMessage({
                  id: getTranslation('settings.page.navigation.maxNavDepth.label'),
                  defaultMessage: 'Max depth of navigation tree',
                })}
              </SettingTitle>
            </Field.Label>
            <Field.Input
              id="maxNavDepth"
              type="number"
              min={0}
              step={1}
              value={config?.navigation?.maxDepth !== undefined ? config.navigation.maxDepth + 1 : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_MAX_DEPTH', payload: Number(e.target.value) - 1 })}
              onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.value === '') return
                dispatch({ type: 'SET_MAX_DEPTH', payload: Number(e.target.value) - 1 })}
              }
            />
            <Field.Hint/>
          </Field.Root>
        </ContentBox>
      </PageWrapper>
    </Page.Protect>
  );
};

export default Settings;
