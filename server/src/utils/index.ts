import duplicateCheck from "./duplicateCheck";
import { createNavItem, updateNavItem, deleteNavItem } from "./navItemHandler";
import { getAdminService, getClientService } from "./pluginHelpers";
import reduceDepthOfOrphanedItems from "./reduceDepthOfOrphanedItems";
import { createExternalRoute, updateRoute } from "./routeHandler";
import buildStructuredNavigation from './buildStructuredNavigation';
import extractRouteAndItems from './extractRouteAndItems';
import getFullPopulateObject from './populateDeep';
import cleanRootKeys from './cleanRootKeys';
import removeWaFields from './removeWaFields';
import buildCanonicalPath from './buildCanonicalPath';
import cascadeCanonicalPathUpdates from "./cascadeCanonicalPathUpdates";
import getRouteAncestors from "./getRouteAncestors";
import getRouteDescendants from "./getRouteDescendants";
import getExternalRouteIds from "./getExternalRouteIds";
import validateRouteDependencies from "./validateRouteDependencies";

export {
  duplicateCheck,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  getAdminService,
  getClientService,
  reduceDepthOfOrphanedItems,
  createExternalRoute,
  updateRoute,
  buildStructuredNavigation,
  extractRouteAndItems,
  getFullPopulateObject,
  cleanRootKeys,
  removeWaFields,
  buildCanonicalPath,
  cascadeCanonicalPathUpdates,
  getRouteAncestors,
  getRouteDescendants,
  getExternalRouteIds,
  validateRouteDependencies,
};
