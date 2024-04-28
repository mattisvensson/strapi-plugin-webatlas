/*
 *
 * Navigation
 *
 */

import {
  CheckPermissions,
} from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import { Button } from '@strapi/design-system/Button';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';

const Navigation = () => {
  
  return (
    <Layout>
      <HeaderLayout
        title='Navigation'
        subtitle='Manage your navigation settings here'
        primaryAction={
          <CheckPermissions permissions={false}>
            <Button type="submit" startIcon={<Check />} disabled={false}>
              Save
            </Button>
          </CheckPermissions>
        }
      />
      <ContentLayout>
        Navigation
      </ContentLayout> 
    </Layout>
  );
};

export default Navigation;
