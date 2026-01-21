/*
 *
 * Settings
 * This file contains the general settings page for the Webatlas plugin.
 * It allows users to configure which content types are enabled for URL aliases and navigations,
 * as well as setting default fields and the URL alias patterns for each content type. 
 *
*/

import type { ContentType, ConfigContentType, PluginConfig } from '../../../../../types';
import { useEffect, useState, useReducer, useRef } from 'react';
import { Box, Accordion, Field } from '@strapi/design-system';
import { useNotification, Page } from '@strapi/strapi/admin'
import usePluginConfig from '../../../hooks/usePluginConfig';
import transformToUrl from '../../../../../utils/transformToUrl';
import useAllContentTypes from '../../../hooks/useAllContentTypes';
import { getTranslation } from '../../../utils';
import { useIntl } from 'react-intl';
import { FullLoader } from '../../../components/UI';
import { PageWrapper, ContentBox, SettingTitle } from '..';
import ContentTypeAccordion from './ContentTypeAccordion';
import { PLUGIN_VERSION, PLUGIN_NAME } from '../../../../../utils/pluginId';
import { Typography } from '@strapi/design-system';
import { Link } from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';
import pluginPermissions from '../../../permissions';

type Action =
  | { type: 'SET_DEFAULT_FIELD'; payload: { ctUid: string; field: string } }
  | { type: 'SET_PATTERN'; payload: { ctUid: string; pattern: string } }
  | { type: 'SET_CONFIG'; payload: PluginConfig }

function reducer(newConfig: PluginConfig | null, action: Action): PluginConfig | null {
  let updatedContentTypes

  switch (action.type) {
    case 'SET_DEFAULT_FIELD':
      if (!newConfig) return null;
      updatedContentTypes = newConfig?.selectedContentTypes.map(ct =>
        ct.uid === action.payload.ctUid ? { ...ct, default: action.payload.field } : ct
      );
      return { ...newConfig, selectedContentTypes: updatedContentTypes || [] };
    case 'SET_PATTERN':
      if (!newConfig) return null;
      updatedContentTypes = newConfig?.selectedContentTypes.map(ct =>
        ct.uid === action.payload.ctUid ? { ...ct, pattern: transformToUrl(action.payload.pattern) } : ct
      );
      return { ...newConfig, selectedContentTypes: updatedContentTypes || [] };
    case 'SET_CONFIG':
      return action.payload;
    default:
      throw new Error();
  }
}

const Settings = () => {
  const { config: fetchedConfig, setConfig, loading, fetchError } = usePluginConfig();
  const [config, dispatch] = useReducer(reducer, fetchedConfig);
  const { contentTypes: allContentTypesData } = useAllContentTypes();
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.pluginOptions?.webatlas?.enabled === true);
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
    if (
      !config 
      || config.selectedContentTypes.find((cta: ConfigContentType) => !cta.default) !== undefined
    ) return

    setIsSaving(true);
    try {
      await setConfig({selectedContentTypes: config.selectedContentTypes })
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
    <Page.Protect permissions={pluginPermissions['settings.general']}>  
      <PageWrapper
        save={save}
        isSaving={isSaving}
        subtitle={formatMessage({
          id: getTranslation('settings.page.general.subtitle'),
          defaultMessage: 'Configure general settings',
        })}
        disabledCondition={JSON.stringify(config) === JSON.stringify(initialConfig.current)}
      >
        <ContentBox title={formatMessage({
          id: getTranslation('settings.page.general.contentTypes'),
          defaultMessage: 'Content Types',
        })}>
          {config?.selectedContentTypes && config.selectedContentTypes.length > 0 ? 
            <Field.Root name="selectedContentTypesAccordion">
              <Field.Label>
                <SettingTitle>
                  {formatMessage({
                    id: getTranslation('settings.page.contentTypeSettings'),
                    defaultMessage: 'Content Type settings',
                  })}
                </SettingTitle> 
              </Field.Label>
              <Accordion.Root>
                {config.selectedContentTypes?.map((contentTypeSettings: ConfigContentType) => {
                  const ct: ContentType | undefined = allContentTypes?.find((item) => item.uid === contentTypeSettings.uid)
                  return <ContentTypeAccordion key={contentTypeSettings.uid} contentType={ct} contentTypeSettings={contentTypeSettings} dispatch={dispatch} />
                })}
              </Accordion.Root>
            </Field.Root>
           : (
            <Typography>
              {formatMessage({
                id: getTranslation('settings.page.general.noContentTypesEnabled'),
                defaultMessage: 'No content types are enabled for Webatlas. Please enable at least one content type to use this plugin.',
              })}
              <Link
                href='https://github.com/mattisvensson/strapi-plugin-webatlas?tab=readme-ov-file#-configuration'
                isExternal
                style={{ marginLeft: 4 }}>
                {formatMessage({
                  id: getTranslation('settings.page.general.noContentTypesEnabled.moreInfo'),
                  defaultMessage: 'More info',
                })}
              </Link>
            </Typography>
          )}
        </ContentBox>
        <ContentBox title={formatMessage({
          id: getTranslation('settings.page.general.details'),
          defaultMessage: 'Details',
        })}>
          <Field.Root name="selectedContentTypesAccordion">
            <Field.Label>
              <SettingTitle>
                { PLUGIN_NAME }{' '}
                {formatMessage({
                  id: getTranslation('version'),
                  defaultMessage: 'Version',
                })}
              </SettingTitle>
            </Field.Label>
            <Typography>
              v{PLUGIN_VERSION}
              <Link
                href={`https://github.com/mattisvensson/strapi-plugin-webatlas/releases/tag/v${PLUGIN_VERSION}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 4 }}>
                <ExternalLink />
              </Link>
            </Typography>
          </Field.Root>
        </ContentBox>
      </PageWrapper>
    </Page.Protect>
  );
};

export default Settings;
