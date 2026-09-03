import { PLUGIN_ID } from './pluginId'
import type { UID } from '@strapi/strapi'

export const waNavigation: UID.ContentType = `plugin::${PLUGIN_ID}.navigation`
export const waNavItem: UID.ContentType = `plugin::${PLUGIN_ID}.navitem`
export const waRoute: UID.ContentType = `plugin::${PLUGIN_ID}.route`
