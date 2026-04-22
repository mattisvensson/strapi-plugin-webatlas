import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from "../../../utils";

export function registerPermissions(strapi: Core.Strapi) {
  // Register permission actions.
  const actions = [
    {
      section: 'plugins',
      displayName: 'Navigation page',
      uid: 'page.navigation',
      subCategory: 'Pages',
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Routes page',
      uid: 'page.routes',
      subCategory: 'Pages',
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'General page',
      uid: 'settings.general',
      subCategory: 'Settings',
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Navigation page',
      uid: 'settings.navigation',
      subCategory: 'Settings',
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Aside panel',
      uid: 'cm.aside',
      subCategory: 'Content Manager',
      pluginName: PLUGIN_ID,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (strapi.admin.services.permission.actionProvider.registerMany as (a: any) => void)(actions);
}
