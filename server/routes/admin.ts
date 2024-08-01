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
      method: 'POST',
      path: '/route/external',
      handler: 'admin.createExternalRoute',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'PUT',
      path: '/route/:id',
      handler: 'admin.updateRoute',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/navigation/:id',
      handler: 'admin.getNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/navigation',
      handler: 'admin.getAllNavigations',
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
      path: '/navigation/:id',
      handler: 'admin.updateNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'DELETE',
      path: '/navigation/:id',
      handler: 'admin.deleteNavigation',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/navigation/:id/nested',
      handler: 'admin.nestedNavigation',
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
      path: '/navitem/:id',
      handler: 'admin.updateNavItem',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'DELETE',
      path: '/navitem/:id',
      handler: 'admin.deleteNavItem',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'POST',
      path: '/checkUniquePath',
      handler: 'admin.checkUniquePath',
      config: {
        policies: [],
        auth: false,
      }
    },
  ]
}
