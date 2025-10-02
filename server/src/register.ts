import set from 'lodash/set';
import { Core, Schema } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  Object.values(strapi.contentTypes).forEach((contentType: Schema.ContentType) => {
    
    // TODO: Only add fields to content types that are allowed to have routes
    if (!contentType.uid.startsWith('api::')) return;
      
    const { attributes } = contentType;

    const fieldSettings = {
      writable: true,
      private: true,
      configurable: false,
      editable: false,
      visible: true,
      default: null,
    }

    set(attributes, 'webatlas_path', {
      ...fieldSettings,
      type: 'string',
    });    
    set(attributes, 'webatlas_override', {
      ...fieldSettings,
      type: 'boolean',
    });    
  });
};
