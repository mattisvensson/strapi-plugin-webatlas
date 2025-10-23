import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../pluginId'

export const waNavigation = `plugin::${PLUGIN_ID}.navigation`;
export const waNavItem = `plugin::${PLUGIN_ID}.navitem`;
export const waRoute = `plugin::${PLUGIN_ID}.route`;

export function getAdminService(): Core.Service {
  return strapi.plugin(PLUGIN_ID)?.service('admin');
}

export function getClientService(): Core.Service {
  return strapi.plugin(PLUGIN_ID)?.service('client');
}