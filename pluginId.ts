import pluginPkg from './package.json';

const PLUGIN_ID = pluginPkg.strapi.name.replace(/^(@[^-,.][\w,-]+\/|strapi-)plugin-/i, '') || 'webatlas';
const PLUGIN_NAME = pluginPkg.strapi.displayName || PLUGIN_ID;

export { PLUGIN_ID, PLUGIN_NAME };
