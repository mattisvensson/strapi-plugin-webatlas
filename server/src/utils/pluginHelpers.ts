import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../pluginId'

export const waPlugin = `plugin::${PLUGIN_ID}`;
export const waNavigation = `${waPlugin}.navigation`;
export const waNavItem = `${waPlugin}.navitem`;
export const waRoute = `${waPlugin}.route`;

export function getAdminService(): Core.Service {
  return strapi.plugin(PLUGIN_ID)?.service('admin');
}

export function getClientService(): Core.Service {
  return strapi.plugin(PLUGIN_ID)?.service('client');
}