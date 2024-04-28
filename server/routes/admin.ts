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
      path: '/route',
      handler: 'admin.createRoute',
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
    }
  ]
}