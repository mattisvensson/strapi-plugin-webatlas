import { waRoute } from '../../../utils'
import {
	buildNavigationPath,
	createExternalRoute,
	deleteRoute,
	createNavItem,
	deleteNavItem,
	reduceDepthOfOrphanedItems,
	updateNavItem,
	updateRoute,
} from './'
export async function handleItemDeletion(navigationItems) {
	var _a
	const errors = []
	let items = [...navigationItems]
	for (let i = 0; i < items.length; i++) {
		const item = items[i]
		// Handle deletions
		if (
			((_a = item.clientModifications) === null || _a === void 0 ? void 0 : _a.type) === 'delete'
		) {
			try {
				if (item.documentId) {
					await deleteNavItem(item.documentId)
				}
				if (item.route.type !== 'internal') {
					await deleteRoute(item.route.documentId)
				}
				const newItems = reduceDepthOfOrphanedItems(items, item.documentId)
				if (!newItems) {
					throw new Error('Failed to reduce depth of orphaned items')
				}
				items = newItems
				i--
			} catch (err) {
				const errorMsg = `Error deleting navigation item: ${err instanceof Error ? err.message : String(err)}`
				errors.push(errorMsg)
				strapi.log.error(errorMsg, err)
			}
			continue
		}
		// Handle items without routes (cleanup)
		// This is a quick fix to remove nav items without route
		// Ideally, nav items without route shouldn't be created at all
		// TODO: Find out why nav items without route can exist
		if (!item.route && item.documentId) {
			try {
				strapi.log.warn('Navigation item without route found. Deleting it.', item)
				await deleteNavItem(item.documentId)
				items.splice(i, 1)
				i-- // Adjust index after removal
			} catch (err) {
				const errorMsg = `Error deleting navigation item without route: ${err instanceof Error ? err.message : String(err)}`
				errors.push(errorMsg)
				strapi.log.error(errorMsg, err)
			}
			continue
		}
	}
	return {
		success: errors.length === 0,
		items,
		errors,
	}
}
export async function handleItemUpdate({
	item,
	calculatedParent,
	calculatedOrder,
	navigationId,
	newNavItemsMap,
}) {
	var _a, _b, _c, _d
	const errors = []
	const isCreate =
		((_a = item.clientModifications) === null || _a === void 0 ? void 0 : _a.type) === 'create'
	const isUpdate =
		((_b = item.clientModifications) === null || _b === void 0 ? void 0 : _b.type) === 'update'
	const isInternal = item.route.type === 'internal'
	// External / wrapper create — no existing route to link, create both route and nav item
	if (isCreate && !item.clientModifications.route) {
		try {
			const newRoute = await createExternalRoute({
				title: item.route.title,
				slug: item.route.slug,
				path: item.route.path,
				type: item.route.type,
			})
			const newNavItem = await createNavItem({
				route: newRoute.documentId,
				navigation: navigationId,
				parent: calculatedParent,
				order: calculatedOrder,
			})
			if (newNavItem) newNavItemsMap.set(item.documentId, newNavItem)
		} catch (err) {
			errors.push(err instanceof Error ? err.message : String(err))
			strapi.log.error(`Error creating navigation item '${item.route.title}': `, err)
		}
		return { success: errors.length === 0, errors }
	}
	// Internal create — link to existing route, update its path and create nav item
	if (isCreate && item.clientModifications.route) {
		try {
			const route = await strapi.documents(waRoute).findOne({
				documentId: item.clientModifications.route,
			})
			if (!route)
				throw new Error(`Related route not found for new navigation item '${item.route.title}'`)
			const path = await buildNavigationPath({
				slug: item.route.slug,
				routeDocumentId: route.documentId,
				calculatedParent,
			})
			await updateRoute(route.documentId, {
				title: item.route.title,
				slug: item.route.slug,
				path,
				isOverride: path !== route.canonicalPath,
			})
			const newNavItem = await createNavItem({
				route: item.clientModifications.route,
				navigation: item.clientModifications.navigation,
				parent: calculatedParent,
				order: calculatedOrder,
			})
			if (newNavItem) newNavItemsMap.set(item.documentId, newNavItem)
		} catch (err) {
			errors.push(err instanceof Error ? err.message : String(err))
			strapi.log.error(
				`Error creating navigation item with existing route '${item.route.title}': `,
				err,
			)
		}
		return { success: errors.length === 0, errors }
	}
	// Existing items — fetch route once, build path once, then update route and/or related entity as needed.
	// needsRouteUpdate: explicit update, or internal item whose path may have shifted due to tree restructuring.
	const needsRouteUpdate = isUpdate || isInternal
	if (needsRouteUpdate || isInternal) {
		try {
			const route = await strapi.documents(waRoute).findOne({
				documentId: item.route.documentId,
			})
			if (!route)
				throw new Error(`Related route not found for navigation item '${item.route.title}'`)
			const slug =
				((_c = item.clientModifications) === null || _c === void 0 ? void 0 : _c.slug) ||
				item.route.slug
			const path = isInternal
				? await buildNavigationPath({
						slug,
						routeDocumentId: route.documentId,
						calculatedParent,
					})
				: slug
			const isOverride = path !== route.canonicalPath
			if (needsRouteUpdate) {
				await updateRoute(route.documentId, {
					title:
						((_d = item.clientModifications) === null || _d === void 0 ? void 0 : _d.title) ||
						item.route.title,
					slug,
					path,
					isOverride,
				})
			}
			if (isInternal) {
				const webatlasObj = {
					path,
					isOverride,
					parentDocumentId: calculatedParent,
					slug,
				}
				await strapi.db.query(item.route.relatedContentType).updateMany({
					where: { documentId: item.route.relatedDocumentId },
					data: { webatlas: webatlasObj },
				})
			}
		} catch (err) {
			errors.push(err instanceof Error ? err.message : String(err))
			strapi.log.error(`Error processing route for navigation item '${item.route.title}': `, err)
		}
	}
	// Update nav item parent/order regardless of create/update since both can change position in the tree
	await updateNavItem(item.documentId, {
		parent: calculatedParent,
		order: calculatedOrder,
	})
	return {
		success: errors.length === 0,
		errors,
	}
}
export function calculateParentAndOrder({
	navigationItems,
	item,
	index,
	parentIds,
	groupIndices,
	newNavItemsMap,
}) {
	var _a
	// Handle depth changes and maintain parent stack
	if (item.depth === 0) {
		if (groupIndices[0] !== undefined) {
			groupIndices[0] = groupIndices[0] + 1
		} else {
			groupIndices[0] = 0
		}
		parentIds.length = 0
	} else {
		const previousItem = navigationItems[index - 1]
		if (previousItem && typeof previousItem.depth === 'number') {
			if (item.depth === previousItem.depth + 1) {
				// Going deeper - previous item becomes parent
				parentIds.push(
					previousItem.documentId.startsWith('temp-')
						? ((_a = newNavItemsMap.get(previousItem.documentId)) === null || _a === void 0
								? void 0
								: _a.documentId) || previousItem.documentId
						: previousItem.documentId,
				)
				groupIndices[item.depth] = 0
			} else if (item.depth <= previousItem.depth) {
				// Going back up - adjust parent stack
				const diff = previousItem.depth - item.depth
				for (let i = 0; i < diff; i++) {
					parentIds.pop()
					groupIndices.pop()
				}
				groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1
			} else {
				// Same level or other case
				groupIndices[item.depth] = (groupIndices[item.depth] || 0) + 1
			}
		}
	}
	const calculatedParent = parentIds.at(-1) || null
	const calculatedOrder = groupIndices[item.depth] || 0
	return {
		calculatedParent,
		calculatedOrder,
	}
}
