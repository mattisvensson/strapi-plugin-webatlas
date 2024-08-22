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
  ]
}
