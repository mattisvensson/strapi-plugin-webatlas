import set from 'lodash/set';
import { Core } from '@strapi/strapi';
import type { ContentType } from '../../types'

export default ({ strapi }: { strapi: Core.Strapi }) => {
  Object.values(strapi.contentTypes).forEach((contentType: ContentType) => {

    // Only add fields to content types that have webatlas enabled in plugin options
    if (!contentType.pluginOptions?.webatlas?.active) return;

    const { attributes } = contentType;

    const fieldSettings = {
      writable: true,
      configurable: false,
      editable: false,
      visible: true,
      default: null,
    }

    set(attributes, 'webatlas_path', {
      ...fieldSettings,
      type: 'string',
      private: false,
    });    
    set(attributes, 'webatlas_override', {
      ...fieldSettings,
      type: 'boolean',
      private: true,
    });    
  });
};
