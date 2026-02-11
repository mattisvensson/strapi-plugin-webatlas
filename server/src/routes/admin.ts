import { PLUGIN_ID } from "../../../utils"

export default {
  type: 'admin',
  routes: [
    // Config
    {
      method: 'GET',
      path: '/config',
      handler: 'admin.getConfig',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.settings.general`,
                `plugin::${PLUGIN_ID}.settings.navigation`,
                `plugin::${PLUGIN_ID}.page.navigation`,
                `plugin::${PLUGIN_ID}.cm.aside`,
              ] 
            }
          },
        ],
      }
    },
    {
      method: 'PUT',
      path: '/config',
      handler: 'admin.updateConfig',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: {
               actions: [
                `plugin::${PLUGIN_ID}.settings.general`,
                `plugin::${PLUGIN_ID}.settings.navigation`,
              ]
            }
          }
        ],
      }
    },

    // Route
    {
      method: 'GET',
      path: '/route',
      handler: 'admin.getAllRoutes',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.page.routes`,
                `plugin::${PLUGIN_ID}.cm.aside`,
              ] 
            }
          }
        ],
      }
    },
    {
      method: 'PUT',
      path: '/route',
      handler: 'admin.updateRoute',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.page.navigation`
              ] 
            }
          }
        ],
      }
    },
    {
      method: 'GET',
      path: '/route/related',
      handler: 'admin.getRelatedRoute',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.cm.aside`,
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },
    {
      method: 'GET',
      path: '/route/hierarchy/:documentId',
      handler: 'admin.getRouteHierarchy',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.cm.aside`,
              ]
            }
          }
        ],
      }
    },

    // Navigation
    {
      method: 'GET',
      path: '/navigation',
      handler: 'admin.getNavigation',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: {
              actions: [
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },
    {
      method: 'POST',
      path: '/navigation',
      handler: 'admin.createNavigation',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },
    {
      method: 'PUT',
      path: '/navigation',
      handler: 'admin.updateNavigation',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },
    {
      method: 'PUT',
      path: '/navigation/items',
      handler: 'admin.updateNavigationItemStructure',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },
    {
      method: 'DELETE',
      path: '/navigation',
      handler: 'admin.deleteNavigation',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },

    // Utility Routes
    {
      method: 'GET',
      path: '/checkUniquePath',
      handler: 'admin.checkUniquePath',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `plugin::${PLUGIN_ID}.has-permissions`,
            config: { 
              actions: [
                `plugin::${PLUGIN_ID}.cm.aside`,
                `plugin::${PLUGIN_ID}.page.navigation`
              ]
            }
          }
        ],
      }
    },
  ]
}
