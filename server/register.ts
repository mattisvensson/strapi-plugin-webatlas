import { Strapi } from '@strapi/strapi';
import _ from 'lodash';

export default ({ strapi }: { strapi: Strapi }) => {
  Object.values(strapi.contentTypes).forEach((contentType) => {
    const { attributes } = contentType;

    // TODO: Check if contentType is enabled in plugin settings
    _.set(attributes, 'url_route', {
      writable: true,
      private: false,
      configurable: false,
      visible: false,
      default: null,
      type: 'json',
    });
  });

};
