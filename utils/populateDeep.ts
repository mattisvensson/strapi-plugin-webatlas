function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function merge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = merge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/*
* Base code from strapi-plugin-populate-deep
*
* https://www.npmjs.com/package/strapi-plugin-populate-deep
* https://github.com/Barelydead/strapi-plugin-populate-deep
* 
* */

import type { UID, Schema } from '@strapi/strapi';

const getModelPopulationAttributes = (model: Schema.Component | Schema.ContentType) => {
  if (model.uid === "plugin::upload.file") {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }
  return model.attributes;
};

export default function getFullPopulateObject(
  modelUid: UID.Schema, 
  maxDepth = 20, 
  ignore: string[] = []
) {

  if (maxDepth <= 1) {
    return true;
  }

  if (modelUid === "admin::user") {
    return false;
  }

  const populate: Record<string, boolean | Record<string, any>> = {};
  const model = strapi.getModel(modelUid);

  if (model.collectionName && !ignore.includes(model.collectionName)) {
    ignore.push(model.collectionName);
  } else if (model.collectionName && ignore.includes(model.collectionName)) {
    return true
  }

  for (const [key, value] of Object.entries(
    getModelPopulationAttributes(model)
  )) {
    if (ignore?.includes(key)) continue
    if (value) {
      if (value.type === "component") {
        populate[key] = getFullPopulateObject(value.component, maxDepth - 1, ignore);
      } else if (value.type === "dynamiczone") {
        const dynamicPopulate = value.components.reduce((prev, cur) => {
          const curPopulate = getFullPopulateObject(cur, maxDepth - 1, ignore);
          if (curPopulate === true) {
            return prev; // Skip if curPopulate is true
          }
          return merge(prev, curPopulate as Record<string, any>);
        }, {} as Record<string, any>);
        
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
