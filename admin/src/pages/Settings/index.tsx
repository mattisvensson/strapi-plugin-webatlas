/*
 *
 * Settings
 * This file contains the settings page for the Webatlas plugin in Strapi.
 * It allows users to configure which content types are enabled for URL aliases and navigations,
 * as well as setting default fields and the URL alias patterns for each content type. 
 *
*/

import { useEffect, useState, useReducer } from 'react';
import { Check } from '@strapi/icons';
import { Button, Box, Accordion, Field } from '@strapi/design-system';
import { Layouts } from '@strapi/admin/strapi-admin'
import { SingleSelect, SingleSelectOption, MultiSelect, MultiSelectOption } from '@strapi/design-system';
import usePluginConfig from '../../hooks/usePluginConfig';
import { ContentType, ConfigContentType, PluginConfig } from '../../../../types';
import transformToUrl from '../../../../utils/transformToUrl';
import Tooltip from '../../components/Tooltip'
import useAllContentTypes from '../../hooks/useAllContentTypes';
import { PLUGIN_NAME } from '../../../../pluginId';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

type Action =
  | { type: 'SET_SELECTED_CONTENT_TYPES'; payload: ConfigContentType[] }
  | { type: 'SET_DEFAULT_FIELD'; payload: { ctUid: string; field: string } }
  | { type: 'SET_PATTERN'; payload: { ctUid: string; pattern: string } }

const Settings = () => {
  const { config, setConfig } = usePluginConfig();
  const [settingsState, dispatch] = useReducer(reducer, config || { selectedContentTypes: [] });
  const { contentTypes: allContentTypesData } = useAllContentTypes();
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.pluginOptions?.webatlas?.active === true);
  const [initialState, setInitialState] = useState(config || { selectedContentTypes: [] })

  const { formatMessage } = useIntl();

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

  useEffect(() => {
    setInitialState(config || { selectedContentTypes: [] })
  }, [config]);

  async function save() {
    if (!settingsState || settingsState.selectedContentTypes.find((cta: ConfigContentType) => !cta.default) !== undefined) return

    try {
      setConfig(settingsState)
      setInitialState(settingsState)
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!config) return;
    dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: config.selectedContentTypes });
  }, [config]);

  return (
    <>
      <Layouts.Header
        title={PLUGIN_NAME}
        subtitle={formatMessage({
          id: getTranslation('settings.page.subtitle'),
          defaultMessage: 'Settings',
        })}
        primaryAction={
          <Button
            type="submit"
            startIcon={<Check />}
            onClick={save}
            disabled={
              JSON.stringify(settingsState) === JSON.stringify(initialState)
              || settingsState.selectedContentTypes.find((cta: ConfigContentType) => !cta.default) !== undefined
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
              {allContentTypes && allContentTypes.map(item => <MultiSelectOption key={item.uid} value={item.uid}>{item.info.displayName}</MultiSelectOption>)}
            </MultiSelect>
            <Field.Hint/>
          </Field.Root>
          {settingsState.selectedContentTypes && settingsState.selectedContentTypes.length > 0 && <Box paddingTop={4}>
            <Field.Root name="selectedContentTypesAccordion">
              <Field.Label>
                {formatMessage({
                  id: getTranslation('settings.page.contentTypeSettings'),
                  defaultMessage: 'Content Type settings',
                })}
              </Field.Label>
              <Accordion.Root>
                {settingsState.selectedContentTypes?.map((contentType: ConfigContentType) => {
                  const ct: ContentType | undefined = allContentTypes?.find((item) => item.uid === contentType.uid)
                  if (!ct) return null
                  return (
                    <Box
                      borderColor={!contentType.default && 'danger500'}
                      key={ct.uid}
                    >
                      <Accordion.Item key={ct.uid} value={ct.uid} size="S">
                        <Accordion.Header>
                          <Accordion.Trigger>
                            {ct?.info.displayName}
                          </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content>
                          <Box padding={3}>
                            <Field.Root
                              name="selectedContentTypes"
                              hint={formatMessage({
                                id: getTranslation('settings.page.defaultField.hint'),
                                defaultMessage: 'The selected field from the content type will be used to generate the URL alias. Use a field that is unique and descriptive, such as a "title" or "name".',
                              })}
                              // hint='The selected field from the content type will be used to generate the URL alias. Use a field that is unique and descriptive, such as a "title" or "name".'
                              error={!contentType.default && formatMessage({
                                id: getTranslation('settings.page.defaultField.error'),
                                defaultMessage: 'Please select a default field',
                              })}
                              required
                            >
                              <Field.Label>
                                {formatMessage({
                                  id: getTranslation('settings.page.defaultField'),
                                  defaultMessage: 'Default URL Alias field',
                                })}
                              </Field.Label>
                              <SingleSelect
                                name={`defaultField-${ct.uid}`}
                                onClear={() => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: ct.uid, field: '' } })}
                                value={contentType?.default || ''}
                                onChange={(value: string) => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: ct.uid, field: value } })}
                              >
                                {Object.entries(ct.attributes).map(([key], index) => {
                                  if (
                                    key === 'id' || 
                                    key === 'documentId' ||
                                    key === 'createdAt' || 
                                    key === 'updatedAt' || 
                                    key === 'createdBy' || 
                                    key === 'updatedBy' ||
                                    key === 'webatlas_path' ||
                                    key === 'webatlas_override'
                                  ) return null
                                  return <SingleSelectOption key={index} value={key}>{key}</SingleSelectOption>
                                })}
                              </SingleSelect>
                              <Field.Hint/>
                            </Field.Root>
                            <Box paddingTop={4}>
                              <Field.Root
                                name="urlAliasPattern"
                                hint={formatMessage({
                                  id: getTranslation('settings.page.urlAliasPattern.hint'),
                                  defaultMessage: 'The pattern to prepend to the generated URL alias. For example, if you enter "blog" and the value of default field is "My First Post", the generated URL alias will be "blog/my-first-post". Leave empty for no prefix.',
                                })}
                              >
                                <Field.Label>
                                  {formatMessage({
                                    id: getTranslation('settings.page.urlAliasPattern'),
                                    defaultMessage: 'URL Alias Pattern',
                                  })}
                                  <Tooltip description={formatMessage({
                                    id: getTranslation('settings.page.urlAliasPattern.tooltip'),
                                    defaultMessage: 'Leading and trailing slashes will be removed. Spaces will be replaced with hyphens. Special characters will be encoded.',
                                  })} />
                                </Field.Label>
                                <Field.Input
                                  value={contentType.pattern}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_PATTERN', payload: { ctUid: ct.uid, pattern: e.target.value } })}
                                  disabled={!contentType.default}
                                  type="text"
                                  placeholder={formatMessage({
                                    id: getTranslation('settings.page.urlAliasPattern.placeholder'),
                                    defaultMessage: 'e.g. blog',
                                  })}
                                />
                                <Field.Hint />
                              </Field.Root>
                            </Box>
                          </Box>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Box>
                  )
                })}
              </Accordion.Root>
            </Field.Root>
          </Box>}
        </Box>
        <Box>
        </Box>
      </Layouts.Content>
    </>
  );
};

export default Settings;
