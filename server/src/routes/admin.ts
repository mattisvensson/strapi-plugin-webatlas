export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/config',
      handler: 'admin.getConfig',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'PUT',
      path: '/config',
      handler: 'admin.updateConfig',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/route',
      handler: 'admin.getRoutes',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'PUT',
      path: '/route',
      handler: 'admin.updateRoute',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/route/external',
      handler: 'admin.createExternalRoute',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/route/external/navitem',
      handler: 'admin.createExternalRouteAndNavItem',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/route/related',
      handler: 'admin.getRelatedRoute',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/navigation',
      handler: 'admin.getNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/navigation',
      handler: 'admin.createNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'PUT',
      path: '/navigation',
      handler: 'admin.updateNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'DELETE',
      path: '/navigation',
      handler: 'admin.deleteNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/navitem',
      handler: 'admin.createNavItem',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'PUT',
      path: '/navitem',
      handler: 'admin.updateNavItem',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'DELETE',
      path: '/navitem',
      handler: 'admin.deleteNavItem',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/checkUniquePath',
      handler: 'admin.checkUniquePath',
      config: {
        policies: [],
        auth: false,
      }
    },
  ]
}
