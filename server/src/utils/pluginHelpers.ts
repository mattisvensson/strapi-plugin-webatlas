import type { Core } from '@strapi/strapi';

export const waNavigation = 'plugin::webatlas.navigation';
export const waNavItem = 'plugin::webatlas.navitem';
export const waRoute = 'plugin::webatlas.route';

export function getAdminService(): Core.Service {
  return strapi.plugin('webatlas').service('admin');
}

export function getClientService(): Core.Service {
  return strapi.plugin('webatlas').service('client');
}