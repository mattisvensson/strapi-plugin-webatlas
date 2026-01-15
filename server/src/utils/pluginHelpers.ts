import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../utils/pluginId'

export function getAdminService(): Core.Service {
  return strapi.plugin(PLUGIN_ID)?.service('admin');
}

export function getClientService(): Core.Service {
  return strapi.plugin(PLUGIN_ID)?.service('client');
}