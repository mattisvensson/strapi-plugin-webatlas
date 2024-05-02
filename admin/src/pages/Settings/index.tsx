/*
 *
 * Settings
 *
 */

import { useEffect, useState } from 'react';
import {
  CheckPermissions,
  useOverlayBlocker,
  request
} from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import { Button } from '@strapi/design-system/Button';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Box } from '@strapi/design-system';
import { Typography } from '@strapi/design-system/Typography';
import { Select, Option } from '@strapi/design-system/Select';

import useAllContentTypes from '../../hooks/useAllContentTypes';

const noopFallback = () => {}

const Settings = () => {
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>();
  const { lockApp = noopFallback, unlockApp = noopFallback } = useOverlayBlocker();
  const { data: allContentTypesData, isLoading: isContentTypesLoading, error: contentTypesErr } = useAllContentTypes();

  const allContentTypes = allContentTypesData?.filter(item => item.isDisplayed);

  async function save() {
    lockApp();

    try {
      await request('/url-routes/config', {
        method: 'PUT',
        body: { 
          selectedContentTypes 
        },
      });
    } catch (err) {
      console.error(err);
    }

    unlockApp()
  }

  useEffect(() => {
    async function getTypes () {
      const contentTypes = await request('/url-routes/config', {
        method: 'GET',
      });
      setSelectedContentTypes(contentTypes.selectedContentTypes)
    }
    getTypes();
  }, [])
  
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
