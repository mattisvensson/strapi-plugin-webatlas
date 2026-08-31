import { SingleSelect, SingleSelectOption, Grid } from '@strapi/design-system'
import { Box, Accordion, Field } from '@strapi/design-system'
import { getTranslation } from '../../../utils'
import { useIntl } from 'react-intl'
import type { ContentType, ConfigContentType, GroupedEntities } from '../../../../../types'
import { useEffect, useState } from 'react'
import Tooltip from '../../../components/Tooltip'

export default function ContentTypeAccordion({
	contentType,
	contentTypeSettings,
	dispatch,
	allGroupedEntities,
}: {
	contentType: ContentType | undefined
	contentTypeSettings: ConfigContentType
	dispatch: React.Dispatch<any>
	allGroupedEntities: GroupedEntities[]
}) {
	const { formatMessage } = useIntl()
	const [selectedContentType, setSelectedContentType] = useState<GroupedEntities | null>(null)

	useEffect(() => {
		if (contentType && !selectedContentType && contentTypeSettings?.defaultParentRoute) {
			allGroupedEntities.forEach((groupedEntity) => {
				const foundEntity = groupedEntity.entities.find(
					(entity) => entity.documentId === contentTypeSettings.defaultParentRoute,
				)
				if (foundEntity) {
					setSelectedContentType({
						contentType: groupedEntity.contentType,
						entities: groupedEntity.entities,
					})
					dispatch({
						type: 'SET_DEFAULT_PARENT_ROUTE',
						payload: { ctUid: contentType.uid, parentRoute: foundEntity.documentId },
					})
					return foundEntity
				}
			})
		}
	}, [contentTypeSettings?.defaultParentRoute, allGroupedEntities, contentType])

	const defaultParentRoute = selectedContentType?.entities.find(
		(entity) => entity.documentId === contentTypeSettings.defaultParentRoute,
	)
	const filteredAttributes = contentType?.attributes
		? Object.entries(contentType.attributes).filter(
				([key, attribute]) => attribute.type === 'string' && key !== 'documentId',
			)
		: []

	if (!contentType) return null

	return (
		<Box
			borderColor={!contentTypeSettings.routeSourceField ? 'danger500' : undefined}
			key={contentType.uid}
		>
			<Accordion.Item key={contentType.uid} value={contentType.uid}>
				<Accordion.Header>
					<Accordion.Trigger>{contentType?.info.displayName}</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content>
					<Box padding={3}>
						<Field.Root
							name="selectedContentTypes"
							hint={formatMessage({
								id: getTranslation('settings.page.generate.hint'),
								defaultMessage:
									'The selected field from the content type will be used to generate the path. Use a field that is unique and descriptive, such as a "title" or "name".',
							})}
							error={
								!contentTypeSettings.routeSourceField &&
								formatMessage({
									id: getTranslation('settings.page.generate.error'),
									defaultMessage: 'Please select a default field',
								})
							}
							required
						>
							<Field.Label>
								{formatMessage({
									id: getTranslation('settings.page.generate'),
									defaultMessage: 'Generate paths from',
								})}
							</Field.Label>
							<SingleSelect
								name={`defaultField-${contentType.uid}`}
								onClear={() =>
									dispatch({
										type: 'SET_DEFAULT_FIELD',
										payload: { ctUid: contentType.uid, field: '' },
									})
								}
								value={contentTypeSettings?.routeSourceField || ''}
								onChange={(value: string | number) =>
									dispatch({
										type: 'SET_DEFAULT_FIELD',
										payload: { ctUid: contentType.uid, field: String(value) },
									})
								}
							>
								{filteredAttributes.map(([key], index) => {
									return (
										<SingleSelectOption key={index} value={key}>
											{key}
										</SingleSelectOption>
									)
								})}
							</SingleSelect>
							<Field.Hint />
						</Field.Root>
						<Grid.Root gap={4} marginTop={4}>
							<Grid.Item col={6} s={12}>
								<Box width="100%">
									<Field.Root name="defaultParentRouteContentType">
										<Field.Label>
											{formatMessage({
												id: getTranslation('settings.page.defaultParentRoute'),
												defaultMessage: 'Default parent route',
											})}
											<Tooltip
												description={formatMessage({
													id: getTranslation('settings.page.defaultParentRoute.hint'),
													defaultMessage:
														'Select a default parent route for the content type. When creating a new entry, the default parent route will be pre-selected.',
												})}
											/>
										</Field.Label>
										<SingleSelect
											name={`defaultParentRoute-${contentType.uid}`}
											onClear={() => {
												setSelectedContentType(null)
												dispatch({
													type: 'SET_DEFAULT_PARENT_ROUTE',
													payload: { ctUid: contentType.uid, parentRoute: null },
												})
											}}
											value={selectedContentType?.contentType.uid || ''}
											onChange={(value: string | number) => {
												const [filteredContentType] = allGroupedEntities.filter(
													(group: GroupedEntities) => group.contentType.uid === value,
												)
												if (filteredContentType) {
													setSelectedContentType(filteredContentType)
													dispatch({
														type: 'SET_DEFAULT_PARENT_ROUTE',
														payload: { ctUid: contentType.uid, parentRoute: null },
													})
												}
											}}
											placeholder={formatMessage({
												id: getTranslation(
													'settings.page.defaultParentRoute.contentType.placeholder',
												),
												defaultMessage: 'Select a content type',
											})}
										>
											{allGroupedEntities.map((groupedEntity) => {
												return (
													<SingleSelectOption
														key={groupedEntity.contentType.uid}
														value={groupedEntity.contentType.uid}
													>
														{groupedEntity.contentType.label}
													</SingleSelectOption>
												)
											})}
										</SingleSelect>
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
							<Grid.Item col={6} s={12} alignItems="flex-end">
								<Box width="100%">
									<Field.Root name="defaultParentRouteEntity">
										<SingleSelect
											name={`defaultParentRoute-${contentType.uid}`}
											onClear={() =>
												dispatch({
													type: 'SET_DEFAULT_PARENT_ROUTE',
													payload: { ctUid: contentType.uid, parentRoute: null },
												})
											}
											placeholder={formatMessage({
												id: getTranslation('settings.page.defaultParentRoute.entity.placeholder'),
												defaultMessage: 'Select an entity',
											})}
											value={defaultParentRoute?.documentId || ''}
											onChange={(value: string | number) =>
												dispatch({
													type: 'SET_DEFAULT_PARENT_ROUTE',
													payload: { ctUid: contentType.uid, parentRoute: String(value) },
												})
											}
											disabled={
												!selectedContentType ||
												selectedContentType.entities.length === 0 ||
												!selectedContentType.contentType.routeSourceField
											}
										>
											{selectedContentType?.entities.map((entity) => {
												return (
													<SingleSelectOption key={entity.documentId} value={entity.documentId}>
														{entity[selectedContentType.contentType.routeSourceField]}
													</SingleSelectOption>
												)
											})}
										</SingleSelect>
										<Field.Hint />
									</Field.Root>
								</Box>
							</Grid.Item>
						</Grid.Root>
					</Box>
				</Accordion.Content>
			</Accordion.Item>
		</Box>
	)
}
