import type { Core } from '@strapi/strapi';
import { PLUGIN_NAME } from '../../../pluginId'

export const waNavigation = `plugin::${PLUGIN_NAME}.navigation`;
export const waNavItem = `plugin::${PLUGIN_NAME}.navitem`;
export const waRoute = `plugin::${PLUGIN_NAME}.route`;

export function getAdminService(): Core.Service {
  return strapi.plugin(PLUGIN_NAME).service('admin');
}

export function getClientService(): Core.Service {
  return strapi.plugin(PLUGIN_NAME).service('client');
}