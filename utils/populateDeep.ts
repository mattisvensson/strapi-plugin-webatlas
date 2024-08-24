/*
* Base code from strapi-plugin-populate-deep
*
* https://www.npmjs.com/package/strapi-plugin-populate-deep
* https://github.com/Barelydead/strapi-plugin-populate-deep
* 
* */

import type { Common, Schema } from '@strapi/strapi';
import { isEmpty, merge } from 'lodash/fp';

const getModelPopulationAttributes = (model: Schema.Component | Schema.ContentType) => {
  if (model.uid === "plugin::upload.file") {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }
  return model.attributes;
};

export default function getFullPopulateObject(modelUid: Common.UID.Schema, maxDepth = 20, ignore?: string[]) {
  
  if (maxDepth <= 1) {
    return true;
  }

  if (modelUid === "admin::user") {
    return false;
  }

  const populate: Record<string, boolean | Record<string, any>> = {};
  const model = strapi.getModel(modelUid);

  if (model.collectionName && ignore && !ignore.includes(model.collectionName)) {
      ignore.push(model.collectionName);
  } 

  for (const [key, value] of Object.entries(
    getModelPopulationAttributes(model)
  )) {
    if (ignore?.includes(key)) continue
    if (value) {
      if (value.type === "component") {
        populate[key] = getFullPopulateObject(value.component, maxDepth - 1);
      } else if (value.type === "dynamiczone") {
        const dynamicPopulate = value.components.reduce((prev, cur) => {
          const curPopulate = getFullPopulateObject(cur, maxDepth - 1);
          return curPopulate === true ? prev : merge(prev, curPopulate);
        }, {});
        
        populate[key] = isEmpty(dynamicPopulate) ? true : dynamicPopulate;
        
      } else if (value.type === "relation") {
        const relationPopulate = getFullPopulateObject(
          //@ts-ignore
          value.target,
          (key === 'localizations') && maxDepth > 2 ? 1 : maxDepth - 1,
          ignore
        );

        if (relationPopulate) populate[key] = relationPopulate;
      } else if (value.type === "media") {
        populate[key] = true;
      }
    }
  }
  return isEmpty(populate) ? true : { populate };
};
