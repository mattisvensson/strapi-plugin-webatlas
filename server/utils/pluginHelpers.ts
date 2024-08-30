export const waNavigation = 'plugin::webatlas.navigation'
export const waNavItem = 'plugin::webatlas.navitem'
export const waRoute = 'plugin::webatlas.route'

export function getAdminService() {
  return strapi.plugin('webatlas').service('admin')
}
export function getClientService() {
  return strapi.plugin('webatlas').service('client')
}