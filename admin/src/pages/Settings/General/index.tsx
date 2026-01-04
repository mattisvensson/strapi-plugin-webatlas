/*
 *
 * Settings
 * This file contains the general settings page for the Webatlas plugin.
 * It allows users to configure which content types are enabled for URL aliases and navigations,
 * as well as setting default fields and the URL alias patterns for each content type. 
 *
*/

import { useEffect, useState, useReducer, useRef } from 'react';
import { Box, Accordion, Field } from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin'
import { MultiSelect, MultiSelectOption } from '@strapi/design-system';
import usePluginConfig from '../../../hooks/usePluginConfig';
import type { ContentType, ConfigContentType, PluginConfig } from '../../../../../types';
import transformToUrl from '../../../../../utils/transformToUrl';
import useAllContentTypes from '../../../hooks/useAllContentTypes';
import { getTranslation } from '../../../utils';
import { useIntl } from 'react-intl';
import { FullLoader } from '../../../components/UI';
import PageWrapper from '../PageWrapper';
import ContentTypeAccordion from './ContentTypeAccordion';

type Action =
  | { type: 'SET_SELECTED_CONTENT_TYPES'; payload: ConfigContentType[] }
  | { type: 'SET_DEFAULT_FIELD'; payload: { ctUid: string; field: string } }
  | { type: 'SET_PATTERN'; payload: { ctUid: string; pattern: string } }
  | { type: 'SET_CONFIG'; payload: PluginConfig }

function reducer(newConfig: PluginConfig | null, action: Action): PluginConfig | null {
  let updatedContentTypes

  switch (action.type) {
    case 'SET_SELECTED_CONTENT_TYPES':
      if (!newConfig) return null;
      updatedContentTypes = action.payload.map(ct => {
        return newConfig?.selectedContentTypes.find((cta: ConfigContentType) => cta.uid === ct.uid) || ct
      })
      return { ...newConfig, selectedContentTypes: updatedContentTypes || [] };
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
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.pluginOptions?.webatlas?.active === true);
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
      disabledCondition={true}
    >
      <FullLoader height={200} />
    </PageWrapper>
  }

  return (
    <PageWrapper
      save={save}
      isSaving={isSaving}
      disabledCondition={JSON.stringify(config) === JSON.stringify(initialConfig.current)}
    >
      <Field.Root
        name="selectedContentTypes"
        hint={formatMessage({
          id: getTranslation('settings.page.enabledContentTypes.hint'),
          defaultMessage: 'Select the content types for which you want to enable URL aliases',
        })}
      >
        <Field.Label>
          {formatMessage({
            id: getTranslation('settings.page.enabledContentTypes'),
            defaultMessage: 'Enabled Content Types',
          })}
        </Field.Label>
        <MultiSelect
          placeholder={formatMessage({
            id: getTranslation('settings.page.enabledContentTypes.placeholder'),
            defaultMessage: 'Select content types...',
          })}
          onClear={() => dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: [] })}
          value={[...config?.selectedContentTypes.map((ct: ConfigContentType) => ct.uid) || []]}
          onChange={(value: string[]) =>
            dispatch({
              type: 'SET_SELECTED_CONTENT_TYPES',
              payload: value.map(v => ({
                uid: v,
                default: '',
                pattern: '',
              })),
            })
          }
          withTags
        >
          {allContentTypes && allContentTypes.map(item => 
            <MultiSelectOption key={item.uid} value={item.uid}>{item.info.displayName}</MultiSelectOption>
          )}
        </MultiSelect>
        <Field.Hint/>
      </Field.Root>
      {config?.selectedContentTypes && config.selectedContentTypes.length > 0 && 
        <Box paddingTop={4}>
          <Field.Root name="selectedContentTypesAccordion">
            <Field.Label>
              {formatMessage({
                id: getTranslation('settings.page.contentTypeSettings'),
                defaultMessage: 'Content Type settings',
              })}
            </Field.Label>
            <Accordion.Root>
              {config.selectedContentTypes?.map((contentTypeSettings: ConfigContentType) => {
                const ct: ContentType | undefined = allContentTypes?.find((item) => item.uid === contentTypeSettings.uid)
                return <ContentTypeAccordion key={contentTypeSettings.uid} contentType={ct} contentTypeSettings={contentTypeSettings} dispatch={dispatch} />
              })}
            </Accordion.Root>
          </Field.Root>
        </Box>
      }
    </PageWrapper>
  );
};

export default Settings;
