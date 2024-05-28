/*
 *
 * Settings
 *
 */

import { useEffect, useState, useReducer } from 'react';
import { CheckPermissions, useOverlayBlocker } from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import { Button, HeaderLayout, Layout, ContentLayout, Box, Select, Option, Accordion, AccordionToggle, AccordionContent, AccordionGroup, Typography, Divider } from '@strapi/design-system';
import usePluginConfig from '../../hooks/usePluginConfig';
import { ContentType } from '../../../../types';

import useAllContentTypes from '../../hooks/useAllContentTypes';

const noopFallback = () => {}

const Settings = () => {
  const [expandedID, setExpandedID] = useState<string | null>(null);
  const [settingsState, dispatch] = useReducer(reducer, { selectedContentTypes: []});
  const { lockApp = noopFallback, unlockApp = noopFallback } = useOverlayBlocker();
  const { contentTypes: allContentTypesData } = useAllContentTypes();
  const { data: config, setConfig } = usePluginConfig();
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.isDisplayed);

  function reducer(settingsState, action) {
    switch (action.type) {
      case 'SET_SELECTED_CONTENT_TYPES':
        return { ...settingsState, selectedContentTypes: action.payload };
        case 'SET_DEFAULT_FIELD':
        const updatedContentTypes = settingsState.selectedContentTypes.map(ct => 
          ct.uid === action.payload.ctUid ? { ...ct, default: action.payload.field } : ct
        );
        return { ...settingsState, selectedContentTypes: updatedContentTypes };
      default:
        throw new Error();
    }
  }

  async function save() {
    lockApp();

    if (!settingsState) {
      unlockApp();
      return;
    }
    try {
      setConfig(settingsState)
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
        title='URL Routes'
        subtitle='Settings'
        primaryAction={
          <CheckPermissions permissions={false}>
            <Button type="submit" startIcon={<Check />} onClick={save} disabled={false}>
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
          <Typography variant="h2">Settings</Typography>
          <Box paddingTop={4} paddingBottom={4}>
            <Divider/>
          </Box>
          <Select
            name="selectedContentTypes"
            label='Enabled Content Types'
            hint='Select the content types you want to enable for URL aliases and navigations'
            onClear={() => dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: [] })}
            value={[...settingsState.selectedContentTypes.map(ct => ct.uid)]}
            onChange={(value: string[]) => dispatch({ type: 'SET_SELECTED_CONTENT_TYPES', payload: value.map(v => ({ uid: v })) })}
            multi
            withTags
            disabled={false}
          >
            {allContentTypes && allContentTypes.map(item => <Option key={item.uid} value={item.uid}>{item.info.displayName}</Option>)}
          </Select>
          {settingsState.selectedContentTypes && settingsState.selectedContentTypes.length > 0 && <Box paddingTop={4}>
            <AccordionGroup label="Content Type settings">
              {settingsState.selectedContentTypes?.map((contentType) => {
                const ct = allContentTypes?.find((item) => item.uid === contentType.uid)
                if (!ct) return null
                return (
                  <Accordion key={ct.uid} expanded={expandedID === ct.uid} onToggle={handleToggle(ct.uid)} id={ct.uid} size="S">
                    <AccordionToggle title={ct?.info.displayName} togglePosition="left" />
                    <AccordionContent>
                      <Box padding={3}>
                        <Typography>
                        <Select
                          name={`defaultField-${ct.uid}`}
                          label='Default URL Alias field'
                          hint='If you leave this empty, the system will use the content type plus the ID as the default value for the URL alias. For example: /api::page.page/1'
                          onClear={() => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: ct.uid, field: '' } })}
                          value={settingsState.selectedContentTypes.find(cta => cta.uid === ct.uid).default || ''}
                          onChange={(value: string) => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: ct.uid, field: value } })}
                        >
                          {Object.entries(ct.attributes).map(([key], index) => {
                            if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'createdBy' || key === 'updatedBy') return null
                            return <Option key={index} value={key}>{key}</Option>
                          })}
                        </Select>
                        </Typography>
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
