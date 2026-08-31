import { Box, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system'
import { RouteStructureProps } from '../../types'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'
import { useMemo, useEffect } from 'react'
import Tooltip from '../Tooltip'

function RouteStructure({
	routes,
	selectedParent,
	setSelectedParent,
	canonicalPath,
	prohibitedRouteIds,
	defaultParentRoute,
	isCreatingEntry,
}: RouteStructureProps) {
	const { formatMessage } = useIntl()

	const handleSelectParent = (value: string) => {
		const parentRoute = routes.find((route) => route.documentId === value) || null
		setSelectedParent(parentRoute)
	}

	const filteredRoutes = useMemo(() => {
		return [...routes]
			.sort((a, b) => a.title.localeCompare(b.title))
			.filter(
				(route) =>
					!prohibitedRouteIds?.includes(route.documentId) ||
					route.documentId === selectedParent?.documentId,
			)
	}, [routes, prohibitedRouteIds, selectedParent])

	const defaultParentRouteValue = useMemo(() => {
		if (defaultParentRoute && isCreatingEntry) {
			const defaultParent = routes.find((route) => route.relatedDocumentId === defaultParentRoute)
			return defaultParent || null
		}
		return null
	}, [defaultParentRoute, routes, isCreatingEntry])

	useEffect(() => {
		if (defaultParentRouteValue && isCreatingEntry) {
			handleSelectParent(defaultParentRouteValue?.documentId || '')
		}
	}, [defaultParentRouteValue, isCreatingEntry])

	const selectValue = selectedParent?.documentId || defaultParentRouteValue?.documentId || ''

	return (
		<Box paddingBottom={2}>
			<Field.Root>
				<Field.Label>
					{formatMessage({
						id: getTranslation('components.CMEditViewAside.path.input.parentSelect.label'),
						defaultMessage: 'Place under',
					})}
				</Field.Label>
				<SingleSelect value={selectValue} onValueChange={handleSelectParent}>
					<SingleSelectOption value="">
						{formatMessage({
							id: getTranslation('components.CMEditViewAside.path.input.parentSelect.rootPath'),
							defaultMessage: 'None (root path)',
						})}
					</SingleSelectOption>
					{filteredRoutes.map((route) => (
						<SingleSelectOption key={route.documentId} value={route.documentId}>
							{route.title}
						</SingleSelectOption>
					))}
				</SingleSelect>
			</Field.Root>
			<Field.Root marginTop={4}>
				<Field.Label>
					{formatMessage({
						id: getTranslation('components.CMEditViewAside.canonicalPath.input.label'),
						defaultMessage: 'Canonical Path',
					})}
					<Tooltip
						description={formatMessage({
							id: getTranslation('components.CMEditViewAside.canonicalPath.input.tooltip'),
							defaultMessage:
								"The path determined by your content's natural hierarchy, independent of where it appears in navigation menus.",
						})}
					/>
				</Field.Label>
				<Field.Input id="canonicalPath-input" value={canonicalPath} disabled />
				<Field.Hint />
			</Field.Root>
		</Box>
	)
}

export default RouteStructure
