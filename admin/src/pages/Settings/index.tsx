/*
 *
 * Settings
 *
 */

import { useEffect, useState, useReducer } from 'react';
import { CheckPermissions, useOverlayBlocker } from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import { Button, HeaderLayout, Layout, ContentLayout, Box, Select, Option, Accordion, AccordionToggle, AccordionContent, AccordionGroup, Typography, Divider, TextInput } from '@strapi/design-system';
import usePluginConfig from '../../hooks/usePluginConfig';
import { ContentType, ConfigContentType, PluginConfig } from '../../../../types';
import transformToUrl from '../../../../utils/transformToUrl';
import Tooltip from '../../components/Tooltip';

import useAllContentTypes from '../../hooks/useAllContentTypes';

type Action = 
  | { type: 'SET_SELECTED_CONTENT_TYPES'; payload: ConfigContentType[] }
  | { type: 'SET_DEFAULT_FIELD'; payload: { ctUid: string; field: string } }
  | { type: 'SET_PATTERN'; payload: { ctUid: string; pattern: string } }
  | { type: 'SET_API_FIELD'; payload: { ctUid: string; apiField: string } };

const noopFallback = () => {}

const Settings = () => {
  const { data: config, setConfig } = usePluginConfig();
  const [expandedID, setExpandedID] = useState<string | null>(null);
  const [settingsState, dispatch] = useReducer(reducer, config || { selectedContentTypes: [] });
  const { lockApp = noopFallback, unlockApp = noopFallback } = useOverlayBlocker();
  const { contentTypes: allContentTypesData } = useAllContentTypes();
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.isDisplayed);
  const [initialState, setInitialState] = useState(config || { selectedContentTypes: [] })

  function reducer(settingsState: PluginConfig, action: Action): PluginConfig {
    let updatedContentTypes
    switch (action.type) {
      case 'SET_SELECTED_CONTENT_TYPES':
        setExpandedID(null)
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
      case 'SET_API_FIELD':
        updatedContentTypes = settingsState.selectedContentTypes.map(ct => 
          ct.uid === action.payload.ctUid ? { ...ct, apiField: transformToUrl(action.payload.apiField) } : ct
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
    lockApp();

    try {
      setConfig(settingsState)
      setInitialState(settingsState)
    } catch (err) {
      console.error(err);
    }

    unlockApp()
  }

  useEffect(() => {
    if (!config) return;
    dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: config.selectedContentTypes });
  }, [config]);

  const handleToggle = (id: string) => () => {
    setExpandedID(s => s === id ? null : id);
  };

  return (
    <Layout>
      <HeaderLayout
        title='Routes'
        subtitle='Settings'
        primaryAction={
          <CheckPermissions permissions={false}>
            <Button
              type="submit"
              startIcon={<Check />}
              onClick={save}
              disabled={JSON.stringify(settingsState) === JSON.stringify(initialState) || settingsState.selectedContentTypes.find((cta: ConfigContentType) => !cta.default) !== undefined}
            >
              Save
            </Button>
          </CheckPermissions>
        }
      />
      <ContentLayout>
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
          <Select
            name="selectedContentTypes"
            label='Enabled Content Types'
            hint='Select the content types you want to enable for URL aliases and navigations'
            onClear={() => dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: [] })}
            value={[...settingsState.selectedContentTypes.map((ct: ConfigContentType) => ct.uid)]}
            onChange={(value: string[]) => dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: value.map(v => ({ uid: v })) })}
            multi
            withTags
            disabled={false}
          >
            {allContentTypes && allContentTypes.map(item => <Option key={item.uid} value={item.uid}>{item.info.displayName}</Option>)}
          </Select>
          {settingsState.selectedContentTypes && settingsState.selectedContentTypes.length > 0 && <Box paddingTop={4}>
            <AccordionGroup label="Content Type settings">
              {settingsState.selectedContentTypes?.map((contentType: ConfigContentType) => {
                const ct: ContentType | undefined = allContentTypes?.find((item) => item.uid === contentType.uid)
                if (!ct) return null
                return (
                  <Accordion key={ct.uid} expanded={expandedID === ct.uid} onToggle={handleToggle(ct.uid)} id={ct.uid} size="S">
                    <Box borderColor={!contentType.default && 'danger500'}>
                      <AccordionToggle title={ct?.info.displayName} togglePosition="left" />
                    </Box>
                    <AccordionContent>
                      <Box padding={3}>
                        <Select
                          required
                          error={!contentType.default && 'Please select a default field'}
                          name={`defaultField-${ct.uid}`}
                          label='Default URL Alias field'
                          hint='The selected field will be used to generate the URL alias. Use a field that is unique and descriptive, such as a "title" or "name".'
                          onClear={() => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: ct.uid, field: '' } })}
                          value={contentType?.default || ''}
                          onChange={(value: string) => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: ct.uid, field: value } })}
                        >
                          {Object.entries(ct.attributes).map(([key], index) => {
                            if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'createdBy' || key === 'updatedBy') return null
                            return <Option key={index} value={key}>{key}</Option>
                          })}
                        </Select>
                        <Box paddingTop={4}>
                          <TextInput
                            label="URL Alias pattern"
                            placeholder="e.g. blog"
                            labelAction={<Tooltip description="Leading and trailing slashes will be removed. Spaces will be replaced with hyphens. Special characters will be encoded."/>}
                            hint="Define the pattern for the URL alias. The default field will be appended to this pattern."
                            value={contentType.pattern}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_PATTERN', payload: { ctUid: ct.uid, pattern: e.target.value } })}                
                            disabled={!contentType.default}
                          />
                        </Box>
                        <Box paddingTop={4}>
                          <TextInput
                            label="URL Alias API field"
                            placeholder="e.g. teaser.teaser_url"
                            labelAction={<Tooltip description="The field which will be visible in the content manger to store the url alias. Necessary for the API."/>}
                            hint="This field is necessary for the API. Do not change this field unless you know what you are doing."
                            value={contentType.apiField}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_API_FIELD', payload: { ctUid: ct.uid, apiField: e.target.value } })}                
                            disabled={!contentType.default}
                          />
                        </Box>
                      </Box>
                    </AccordionContent>
                  </Accordion>
                )
              })}
            </AccordionGroup>
          </Box>}
        </Box>
        <Box>
        </Box>
      </ContentLayout>
    </Layout>
  );
};

export default Settings;
