export default {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/path',
      handler: 'client.getEntityByPath',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/navigation/:id',
      handler: 'client.getNavigation',
      config: {
        policies: [],
      }
    },
  ]
}
