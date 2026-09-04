import {
	ContentType,
	Route,
	GroupedEntities,
	RouteSettings,
	ConfigContentType,
	StructuredNavigationVariant,
	NavigationInput,
	NestedNavItem,
} from '../../../types'
import { useFetchClient } from '@strapi/strapi/admin'
import { PLUGIN_ID } from '../../../utils'

export default function useApi() {
	const { get, put, del, post } = useFetchClient()

	const fetchAllContentTypes = async () => {
		const { data } = await get('/content-manager/content-types')
		return data.data
	}

	const fetchAllEntities = async (): Promise<GroupedEntities[]> => {
		const { data } = await get(`/${PLUGIN_ID}/config`)
		const contentTypes = data?.selectedContentTypes || []

		if (!contentTypes || contentTypes.length === 0) {
			return []
		}

		let entities: GroupedEntities[] = []

		const entityResults = await Promise.allSettled(
			contentTypes.map(async (contentType: ConfigContentType) => {
				try {
					const { data } = await get(
						`/content-manager/collection-types/${contentType.uid}?pageSize=9999`,
					)

					if (!data || !data.results) {
						return null
					}

					return {
						entities: data.results,
						contentType,
					}
				} catch (err) {
					// Tolerated on purpose: a content type the user cannot read must not fail the
					// whole list
					console.error(`Cannot access entities for ${contentType.uid}:`, err)
					return null
				}
			}),
		)

		entities = entityResults
			.map((result) => (result.status === 'fulfilled' ? result.value : null))
			.filter(Boolean) as GroupedEntities[]

		return entities
	}

	const getRelatedRoute = async (relatedDocumentId: string): Promise<Route> => {
		const { data } = await get(`/${PLUGIN_ID}/route/related?documentId=${relatedDocumentId}`)
		return data
	}

	const getRoute = async (documentId: string): Promise<Route> => {
		const { data } = await get(`/${PLUGIN_ID}/route/${documentId}`)
		return data
	}

	const getAllRoutes = async (): Promise<Route[]> => {
		const { data } = await get(`/${PLUGIN_ID}/route`)
		return data
	}

	const getProhibitedRouteIds = async (documentId?: string): Promise<string[]> => {
		const { data } = await get(
			`/${PLUGIN_ID}/route/prohibitedIds/${documentId ? `${documentId}` : ''}`,
		)
		return data
	}

	const getNavigation = async ({
		documentId,
		variant,
	}: {
		documentId?: string
		variant?: StructuredNavigationVariant | 'namesOnly'
	} = {}) => {
		const query = []
		if (documentId) query.push(`documentId=${documentId}`)
		if (variant) query.push(`variant=${variant}`)
		const { data } = await get(
			`/${PLUGIN_ID}/navigation${query.length > 0 ? `?${query.join('&')}` : ''}`,
		)
		return data
	}

	const createNavigation = async (body: NavigationInput) => {
		const { data } = await post(`/${PLUGIN_ID}/navigation`, {
			data: body,
		})
		return data
	}

	const deleteNavigation = async (documentId: string) => {
		const { data } = await del(`/${PLUGIN_ID}/navigation?documentId=${documentId}`)
		return data
	}

	const updateNavigation = async (documentId: string, body: NavigationInput) => {
		const { data } = await put(`/${PLUGIN_ID}/navigation?documentId=${documentId}`, {
			data: body,
		})
		return data
	}

	const updateNavigationItemStructure = async (
		documentId: string,
		navigationItems: NestedNavItem[],
	) => {
		const { data } = await put(`/${PLUGIN_ID}/navigation/items`, {
			navigationId: documentId,
			navigationItems,
		})
		return data
	}

	return {
		fetchAllContentTypes,
		fetchAllEntities,
		getRelatedRoute,
		getRoute,
		getAllRoutes,
		getProhibitedRouteIds,
		getNavigation,
		createNavigation,
		deleteNavigation,
		updateNavigation,
		updateNavigationItemStructure,
	}
}
