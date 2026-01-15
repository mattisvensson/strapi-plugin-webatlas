import { waPlugin } from "../../../utils"

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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.settings.general`,
                `${waPlugin}.settings.navigation`,
                `${waPlugin}.page.navigation`,
                `${waPlugin}.cm.aside`,
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
            name: `${waPlugin}.has-permissions`,
            config: {
               actions: [
                `${waPlugin}.settings.general`,
                `${waPlugin}.settings.navigation`,
                `${waPlugin}.page.navigation`, // TODO: update usePluginConfig, then remove this
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
      handler: 'admin.getRoutes',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { 
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.page.routes`,
                `${waPlugin}.cm.aside`,
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.cm.aside`,
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: {
              actions: [
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.page.navigation`
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
            name: `${waPlugin}.has-permissions`,
            config: { 
              actions: [
                `${waPlugin}.cm.aside`,
                `${waPlugin}.page.navigation`
              ]
            }
          }
        ],
      }
    },
  ]
}
