import { PLUGIN_ID } from "../../utils";

const pluginPermissions = {
  'cm.aside': [{ action: `plugin::${PLUGIN_ID}.cm.aside`, subject: null }],
  'page.navigation': [{ action: `plugin::${PLUGIN_ID}.page.navigation`, subject: null }],
  'page.routes': [{ action: `plugin::${PLUGIN_ID}.page.routes`, subject: null }],
  'settings.general': [{ action: `plugin::${PLUGIN_ID}.settings.general`, subject: null }],
  'settings.navigation': [{ action: `plugin::${PLUGIN_ID}.settings.navigation`, subject: null }],
};

export default pluginPermissions;
