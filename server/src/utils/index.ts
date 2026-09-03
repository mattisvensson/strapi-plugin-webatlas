import duplicateCheck from './duplicateCheck'
import { createNavItem, updateNavItem, deleteNavItem } from './navItemHandler'
import { getAdminService, getClientService } from './pluginHelpers'
import reduceDepthOfOrphanedItems from './reduceDepthOfOrphanedItems'
import { createExternalRoute, updateRoute, deleteRoute } from './routeHandler'
import buildStructuredNavigation from './buildStructuredNavigation'
import extractRouteAndItems from './extractRouteAndItems'
import getFullPopulateObject from './populateDeep'
import cleanRootKeys from './cleanRootKeys'
import removeWaFields from './removeWaFields'
import buildCanonicalPath from './buildCanonicalPath'
import cascadePathUpdates from './cascadePathUpdates'
import getRouteAncestors from './getRouteAncestors'
import getRouteDescendants from './getRouteDescendants'
import getNonInternalRouteIds from './getNonInternalRouteIds'
import validateRouteDependencies from './validateRouteDependencies'
import buildNavigationPath from './buildNavigationPath'
import {
	handleItemDeletion,
	handleItemUpdate,
	calculateParentAndOrder,
} from './navigationItemStructure'
import { enrichWebatlasData } from './enrichWebatlasData'
import { enrichRoutePickerFields } from './enrichRoutePickerFields'
import isBlacklistedPath from './isBlacklistedPath'
import assertPathAllowed, { getRouteBlacklist } from './assertPathAllowed'
import assertDescendantPathsAllowed from './assertDescendantPathsAllowed'
import normalizeRouteBlacklist from './normalizeRouteBlacklist'
import { addWebatlasBreadcrumb } from './addWebatlasBreadcrumb'

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
	deleteRoute,
	buildStructuredNavigation,
	extractRouteAndItems,
	getFullPopulateObject,
	cleanRootKeys,
	removeWaFields,
	buildCanonicalPath,
	cascadePathUpdates,
	getRouteAncestors,
	getRouteDescendants,
	getNonInternalRouteIds,
	validateRouteDependencies,
	buildNavigationPath,
	handleItemDeletion,
	handleItemUpdate,
	calculateParentAndOrder,
	enrichWebatlasData,
	enrichRoutePickerFields,
	isBlacklistedPath,
	assertPathAllowed,
	getRouteBlacklist,
	assertDescendantPathsAllowed,
	normalizeRouteBlacklist,
	addWebatlasBreadcrumb,
}
