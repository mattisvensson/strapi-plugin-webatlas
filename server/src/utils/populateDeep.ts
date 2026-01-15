import type { UID, Schema } from '@strapi/strapi';
import { isEmpty, merge } from 'lodash/fp';

/*
* Base code from original strapi-plugin-populate-deep Strapi v4 plugin:*
* https://github.com/Barelydead/strapi-plugin-populate-deep
* 
* Some modifications were made to work with Strapi v5:
* https://github.com/NEDDL/strapi-v5-plugin-populate-deep
* 
* The Strapi v5 version has been used as a base and further modified to
* fit the specific needs of this project, mainly typescript types.
*/

const getModelPopulationAttributes = (model: Schema.Component | Schema.ContentType) => {
  if (model.uid === "plugin::upload.file") {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }

  return model.attributes;
};

export default function getFullPopulateObject(modelUid: UID.Schema, maxDepth = 5, ignore: string[] = []) {
  if (maxDepth <= 1) {
    return true;
  }
  if (modelUid === "admin::user") {
    return false;
  }

  if (ignore.includes(modelUid)) {
    return true;
  }

  const populate: Record<string, boolean | Record<string, any>> = {};
  const model = strapi.getModel(modelUid);
  
  const newIgnore = [...ignore, modelUid];

  for (const [key, value] of Object.entries(getModelPopulationAttributes(model))) {
    if (ignore?.includes(key)) continue;
    if (value) {
      if (value.type === "component") {
        const componentPopulate = getFullPopulateObject(value.component, maxDepth - 1, newIgnore);
        if (componentPopulate) {
          populate[key] = componentPopulate;
        }
      } else if (value.type === "dynamiczone") {
        const dynamicPopulate = value.components.reduce((prev, cur) => {
          const curPopulate = getFullPopulateObject(cur, maxDepth - 1, newIgnore);
          if (curPopulate !== false) {
            return merge(prev, {[cur]: curPopulate});
          }
          return prev;
        }, {});
        populate[key] = isEmpty(dynamicPopulate) ? true : { on: dynamicPopulate };
      } else if (value.type === "relation") {
        if ('target' in value && value.target) {
          const relationPopulate = getFullPopulateObject(
            value.target as UID.Schema,
            key === "localizations" && maxDepth > 2 ? 1 : maxDepth - 1,
            newIgnore
          );
          if (relationPopulate) {
            populate[key] = relationPopulate;
          }
        }
      } else if (value.type === "media") {
        populate[key] = true;
      }
    }
  }
  return isEmpty(populate) ? true : { populate };
}