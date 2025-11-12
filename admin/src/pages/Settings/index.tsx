/*
 *
 * Settings
 * This file contains the settings page for the Webatlas plugin in Strapi.
 * It allows users to configure which content types are enabled for URL aliases and navigations,
 * as well as setting default fields and the URL alias patterns for each content type. 
 *
*/

import { useEffect, useState, useReducer } from 'react';
import { Box, Accordion, Field } from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin'
import { MultiSelect, MultiSelectOption } from '@strapi/design-system';
import usePluginConfig from '../../hooks/usePluginConfig';
import type { ContentType, ConfigContentType, PluginConfig } from '../../../../types';
import transformToUrl from '../../../../utils/transformToUrl';
import useAllContentTypes from '../../hooks/useAllContentTypes';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { FullLoader } from '../../components/UI';
import PageWrapper from './PageWrapper';
import ContentTypeAccordion from './ContentTypeAccordion';

type Action =
  | { type: 'SET_SELECTED_CONTENT_TYPES'; payload: ConfigContentType[] }
  | { type: 'SET_DEFAULT_FIELD'; payload: { ctUid: string; field: string } }
  | { type: 'SET_PATTERN'; payload: { ctUid: string; pattern: string } }

function reducer(settingsState: PluginConfig, action: Action): PluginConfig {
  let updatedContentTypes
  switch (action.type) {
    case 'SET_SELECTED_CONTENT_TYPES':
      updatedContentTypes = action.payload.map(ct => {
        return settingsState.selectedContentTypes.find((cta: ConfigContentType) => cta.uid === ct.uid) || ct
      })
      return { ...settingsState, selectedContentTypes: updatedContentTypes };
    case 'SET_DEFAULT_FIELD':
      updatedContentTypes = settingsState.selectedContentTypes.map(ct =>
        ct.uid === action.payload.ctUid ? { ...ct, default: action.payload.field } : ct
      );
      return { ...settingsState, selectedContentTypes: updatedContentTypes };
    case 'SET_PATTERN':
      updatedContentTypes = settingsState.selectedContentTypes.map(ct =>
        ct.uid === action.payload.ctUid ? { ...ct, pattern: transformToUrl(action.payload.pattern) } : ct
      );
      return { ...settingsState, selectedContentTypes: updatedContentTypes };
    default:
      throw new Error();
  }
}

const Settings = () => {
  const { config, setConfig, loading, fetchError } = usePluginConfig();
  const [settingsState, dispatch] = useReducer(reducer, config || { selectedContentTypes: [] });
  const { contentTypes: allContentTypesData } = useAllContentTypes();
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.pluginOptions?.webatlas?.active === true);
  const [initialState, setInitialState] = useState(config || { selectedContentTypes: [] })
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();

  useEffect(() => {
    setInitialState(config || { selectedContentTypes: [] })
  }, [config]);

  useEffect(() => {
    if (!config) return;
    dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: config.selectedContentTypes });
  }, [config]);
  
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
      !settingsState 
      || settingsState.selectedContentTypes.find((cta: ConfigContentType) => !cta.default) !== undefined
    ) return

    try {
      await setConfig(settingsState)
      setInitialState(settingsState)

      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('notification.settings.saved'),
          defaultMessage: 'Settings saved successfully',
        }),
      });
    } catch (err) {
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
    return <PageWrapper>
      <FullLoader height={200} />
    </PageWrapper>
  }

  return (
    <PageWrapper settingsState={settingsState} initialState={initialState} save={save}>
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
          value={[...settingsState.selectedContentTypes.map((ct: ConfigContentType) => ct.uid)]}
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
      {settingsState.selectedContentTypes && settingsState.selectedContentTypes.length > 0 && 
        <Box paddingTop={4}>
          <Field.Root name="selectedContentTypesAccordion">
            <Field.Label>
              {formatMessage({
                id: getTranslation('settings.page.contentTypeSettings'),
                defaultMessage: 'Content Type settings',
              })}
            </Field.Label>
            <Accordion.Root>
              {settingsState.selectedContentTypes?.map((contentTypeSettings: ConfigContentType) => {
                const ct: ContentType | undefined = allContentTypes?.find((item) => item.uid === contentTypeSettings.uid)
                return <ContentTypeAccordion contentType={ct} contentTypeSettings={contentTypeSettings} dispatch={dispatch} />
              })}
            </Accordion.Root>
          </Field.Root>
        </Box>
      }
    </PageWrapper>
  );
};

export default Settings;
