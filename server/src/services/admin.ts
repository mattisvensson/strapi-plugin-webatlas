import type {
	NavigationInput,
	NestedNavigation,
	NestedNavItem,
	Route,
	PluginConfig,
	StructuredNavigationVariant,
} from '../../../types'
import { errors } from '@strapi/utils'
import { transformToUrl, waRoute, waNavigation, waNavItem, PLUGIN_ID } from '../../../utils'
import {
	handleItemDeletion,
	handleItemUpdate,
	calculateParentAndOrder,
	buildStructuredNavigation,
	getNonInternalRouteIds,
	getRouteDescendants,
	duplicateCheck,
	normalizeRouteBlacklist,
	getRouteBlacklist,
	isBlacklistedPath,
} from '../utils'

export default ({ strapi }) => ({
	async updateConfig(newConfig: Partial<PluginConfig>) {
		if (!newConfig) return

		const pluginStore = await strapi.store({
			type: 'plugin',
			name: PLUGIN_ID,
		})
		const config = await pluginStore.get({ key: 'config' })
		const newConfigMerged: PluginConfig = { ...config, ...newConfig }

		if (newConfig.routeBlacklist !== undefined)
			newConfigMerged.routeBlacklist = normalizeRouteBlacklist(newConfig.routeBlacklist)

		await pluginStore.set({ key: 'config', value: newConfigMerged })

		// TODO: Is it necessary/intended to delete/mark invalid routes here?
		// if (newConfigMerged.selectedContentTypes) {
		//   try {
		//     const routes = await strapi.documents(waRoute).findMany();
		//     const invalidRoutes = routes.filter((route: Route) =>
		//       route.internal && !newConfigMerged.selectedContentTypes.find((type) => type.uid === route.relatedContentType)
		//     );
		//     for (const route of invalidRoutes) {
		//       // await strapi.documents(waNavItem).deleteMany({
		//       //   where: {
		//       //     route: route.documentId
		//       //   }
		//       // });
		//       // await strapi.documents(waRoute).delete({ documentId: route.documentId });
		//     }
		//   } catch (err) {
		//     strapi.log.error(err);
		//   }
		// }

		return newConfigMerged
	},

	async getConfig() {
		const pluginStore = await strapi.store({ type: 'plugin', name: PLUGIN_ID })
		let config = await pluginStore.get({
			key: 'config',
		})

		const defaultConfig = strapi.config.get(`plugin::${PLUGIN_ID}`)

		config = {
			...defaultConfig,
			...config,
			navigation: {
				...defaultConfig.navigation,
				...config?.navigation,
			},
		}

		return config
	},

	async getRoute(documentId: string) {
		return await strapi.documents(waRoute).findOne({
			documentId: documentId,
		})
	},

	async getAllRoutes() {
		return await strapi.documents(waRoute).findMany()
	},

	async getRelatedRoute(documentId: string) {
		return await strapi.db?.query(waRoute).findOne({
			where: {
				relatedDocumentId: documentId,
			},
			populate: ['parent'],
		})
	},

	async getProhibitedRouteIds(documentId: string | undefined) {
		let route: Route | null = null
		if (documentId) {
			route = (await strapi.documents(waRoute).findOne({
				documentId: documentId,
			})) as Route | null
		}

		const descendants = route?.documentId ? await getRouteDescendants(route.documentId) : []
		const nonInternalRouteIds = await getNonInternalRouteIds()

		const prohibitedRouteIds = [...descendants, ...nonInternalRouteIds]
		route?.documentId && prohibitedRouteIds.push(route.documentId)

		return prohibitedRouteIds
	},

	async getNavigation(documentId?: string, variant?: StructuredNavigationVariant | 'namesOnly') {
		let navigation = null

		if (variant === 'namesOnly') {
			if (documentId) {
				return await strapi.documents(waNavigation).findOne({
					documentId: documentId,
					select: ['documentId', 'name', 'slug', 'visible'],
				})
			}
			return await strapi.documents(waNavigation).findMany({
				select: ['documentId', 'name', 'slug', 'visible'],
			})
		}

		if (documentId) {
			navigation = await strapi.documents(waNavigation).findOne({
				documentId: documentId,
				populate: ['items', 'items.route', 'items.parent'],
			})

			if (!navigation) throw new errors.NotFoundError('Navigation not found')

			if (variant) navigation = buildStructuredNavigation(navigation, variant)
		} else {
			navigation = await strapi.documents(waNavigation).findMany({
				populate: ['items', 'items.route', 'items.parent'],
			})

			if (!navigation) throw new errors.NotFoundError('Navigation not found')

			if (variant) {
				navigation = navigation.map((nav: NestedNavigation) =>
					buildStructuredNavigation(nav, variant),
				)
			}
		}

		return navigation
	},

	async createNavigation(name: string, visible: boolean) {
		return await strapi.documents(waNavigation).create({
			data: {
				name: name,
				slug: transformToUrl(name),
				visible: visible,
			},
		})
	},

	async updateNavigation(documentId: string, data: NavigationInput) {
		return await strapi.documents(waNavigation).update({
			documentId: documentId,
			data: {
				name: data.name,
				visible: data.visible,
			},
		})
	},

	async deleteNavigation(documentId: string) {
		const navigation = await strapi.documents(waNavigation).findOne({
			documentId: documentId,
			populate: ['items'],
		})

		if (!navigation) throw new errors.NotFoundError('Navigation not found')

		for (const item of navigation.items) {
			await strapi.documents(waNavItem).delete({
				documentId: item.documentId,
			})
		}

		return await strapi.documents(waNavigation).delete({
			documentId: documentId,
		})
	},

	async updateNavigationItemStructure(navigationId: string, navigationItems: NestedNavItem[]) {
		if (!navigationId || !navigationItems) return

		const errors: string[] = []
		let newNavItemsMap = new Map<string, NestedNavItem>()

		// First pass: Validate and prepare items
		const deletionResult = await handleItemDeletion(navigationItems)
		if (!deletionResult.success) {
			errors.push(...deletionResult.errors)
			strapi.log.error('Deletion errors:', deletionResult.errors)
		}

		navigationItems = deletionResult.items

		// Second pass: Process items sequentially and maintain parent/depth tracking
		let parentIds: string[] = []
		let groupIndices: number[] = []

		for (const [index, item] of navigationItems.entries()) {
			if (typeof item.depth !== 'number') {
				continue
			}

			try {
				const { calculatedParent, calculatedOrder } = calculateParentAndOrder({
					navigationItems,
					item,
					index,
					parentIds,
					groupIndices,
					newNavItemsMap,
				})

				const result = await handleItemUpdate({
					item,
					calculatedParent,
					calculatedOrder,
					navigationId,
					newNavItemsMap,
				})

				if (!result.success) {
					errors.push(...result.errors)
					strapi.log.error('Error updating item: ', item)
				}
			} catch (err) {
				errors.push(err instanceof Error ? err.message : String(err))
				strapi.log.error('Error updating navigation item ', err)
			}
		}

		return { success: errors.length === 0, errors }
	},

	async checkUniquePath(initialPath: string, targetRouteDocumentId: string | null = null) {
		const routeBlacklist = await getRouteBlacklist()
		if (isBlacklistedPath(initialPath, routeBlacklist)) return { blacklisted: true }

		return { uniquePath: await duplicateCheck(initialPath, targetRouteDocumentId) }
	},
})
