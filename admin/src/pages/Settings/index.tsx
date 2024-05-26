/*
 *
 * Settings
 *
 */

import { useEffect, useState } from 'react';
import { CheckPermissions, useOverlayBlocker } from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import { Button, HeaderLayout, Layout, ContentLayout, Box, Select, Option } from '@strapi/design-system';
import usePluginConfig from '../../hooks/usePluginConfig';
import { ContentType } from '../../../../types';

import useAllContentTypes from '../../hooks/useAllContentTypes';

const noopFallback = () => {}

const Settings = () => {
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>();
  const { lockApp = noopFallback, unlockApp = noopFallback } = useOverlayBlocker();
  const { contentTypes: allContentTypesData } = useAllContentTypes();
  const { data: config, setConfig } = usePluginConfig();
  const allContentTypes = allContentTypesData?.filter((ct: ContentType) => ct.isDisplayed);

  async function save() {
    lockApp();

    if (!selectedContentTypes) {
      unlockApp();
      return;
    }
    try {
      setConfig({ selectedContentTypes })
    } catch (err) {
      console.error(err);
    }

    unlockApp()
  }

  useEffect(() => {
    if (!config) return
    setSelectedContentTypes(config.selectedContentTypes)
  }, [config])

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
          <Select
            name="selectedContentTypes"
            label='Select'
            onClear={() => setSelectedContentTypes([])}
            value={selectedContentTypes}
            onChange={(value: string[]) => setSelectedContentTypes(value)}
            multi
            withTags
            disabled={false}
          >
            {allContentTypes && allContentTypes.map(item => <Option key={item.uid} value={item.uid}>{item.info.displayName}</Option>)}
          </Select>
        </Box>
      </ContentLayout>
    </Layout>
  );
};

export default Settings;
