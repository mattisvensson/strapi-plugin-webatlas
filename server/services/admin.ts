export default ({strapi}) => ({

  async updateConfig(newConfig) {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'url-routes' });
    await pluginStore.set({ key: "config", value: newConfig });
  },

  async getConfig() {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'url-routes' });
    const config = await pluginStore.get({
      key: "config",
    });
    return config
  }
})