/*
 *
 * Settings
 * This file contains the general settings page for the Webatlas plugin.
 * It allows users to configure which content types are enabled for URL aliases and navigations,
 * as well as setting default fields for each content type.
 *
 */

import type { ContentType, ConfigContentType, PluginConfig } from '../../../../../types'
import { useEffect, useState, useReducer, useRef, useMemo } from 'react'
import { Accordion, Field } from '@strapi/design-system'
import { useNotification, Page } from '@strapi/strapi/admin'
import { useAllContentTypes, usePluginConfig, useAllEntities } from '../../../hooks'
import { getTranslation, getRouteSourceFields } from '../../../utils'
import { useIntl } from 'react-intl'
import { FullLoader } from '../../../components/UI'
import { PageWrapper, ContentBox, SettingTitle } from '..'
import ContentTypeAccordion from './ContentTypeAccordion'
import { PLUGIN_VERSION, PLUGIN_NAME } from '../../../../../utils/pluginId'
import { Typography, Box } from '@strapi/design-system'
import { Link } from '@strapi/design-system'
import { ExternalLink } from '@strapi/icons'
import pluginPermissions from '../../../permissions'

type Action =
	| { type: 'SET_DEFAULT_FIELD'; payload: { ctUid: string; field: string } }
	| { type: 'SET_DEFAULT_PARENT_ROUTE'; payload: { ctUid: string; parentRoute: string | null } }
	| { type: 'SET_ROUTE_BLACKLIST'; payload: { blacklist: string[] } }
	| { type: 'SET_CONFIG'; payload: PluginConfig }

function reducer(newConfig: PluginConfig | null, action: Action): PluginConfig | null {
	let updatedContentTypes

	switch (action.type) {
		case 'SET_DEFAULT_FIELD':
			if (!newConfig) return null
			updatedContentTypes = newConfig?.selectedContentTypes.map((ct) =>
				ct.uid === action.payload.ctUid ? { ...ct, routeSourceField: action.payload.field } : ct,
			)
			return { ...newConfig, selectedContentTypes: updatedContentTypes || [] }
		case 'SET_DEFAULT_PARENT_ROUTE':
			if (!newConfig) return null
			updatedContentTypes = newConfig?.selectedContentTypes.map((ct) =>
				ct.uid === action.payload.ctUid
					? { ...ct, defaultParentRoute: action.payload.parentRoute }
					: ct,
			)
			return { ...newConfig, selectedContentTypes: updatedContentTypes || [] }
		case 'SET_ROUTE_BLACKLIST':
			if (!newConfig) return null
			return { ...newConfig, routeBlacklist: action.payload.blacklist }
		case 'SET_CONFIG':
			return action.payload
		default:
			throw new Error()
	}
}

const Settings = () => {
	const { config: fetchedConfig, setConfig, loading, fetchError } = usePluginConfig()
	const [config, dispatch] = useReducer(reducer, fetchedConfig)
	const { contentTypes: allContentTypesData } = useAllContentTypes()
	const allContentTypes = allContentTypesData?.filter(
		(ct: ContentType) => ct.pluginOptions?.webatlas?.enabled === true,
	)
	const { toggleNotification } = useNotification()
	const { formatMessage } = useIntl()
	const [isSaving, setIsSaving] = useState(false)
	const [blacklistInput, setBlacklistInput] = useState('')
	const initialConfig = useRef<PluginConfig | null>(fetchedConfig)
	const { entities, loading: entitiesLoading } = useAllEntities()

	// Without a route source field no route can be generated, so the content type is not selectable as parent
	const selectableEntities = useMemo(
		() =>
			entities.filter((groupedEntity) =>
				config?.selectedContentTypes.some(
					(ct) => ct.uid === groupedEntity.contentType.uid && ct.routeSourceField,
				),
			),
		[entities, config?.selectedContentTypes],
	)

	// A content type that offers usable fields must have one selected before the settings can be saved
	const hasMissingRouteSourceField =
		config?.selectedContentTypes.some(
			(ct) =>
				!ct.routeSourceField &&
				getRouteSourceFields(allContentTypes?.find((item) => item.uid === ct.uid)).length > 0,
		) ?? false

	useEffect(() => {
		initialConfig.current = fetchedConfig

		if (fetchedConfig) {
			dispatch({ type: 'SET_CONFIG', payload: fetchedConfig })
			setBlacklistInput(fetchedConfig.routeBlacklist?.join(', ') || '')
		}
	}, [fetchedConfig])

	useEffect(() => {
		if (fetchError) {
			toggleNotification({
				type: 'danger',
				message:
					formatMessage({
						id: getTranslation('notification.error'),
						defaultMessage: 'An error occurred',
					}) +
					': ' +
					fetchError,
			})
		}
	}, [fetchError, toggleNotification, formatMessage])

	async function save() {
		if (!config || hasMissingRouteSourceField) return

		setIsSaving(true)
		try {
			await setConfig({
				selectedContentTypes: config.selectedContentTypes,
				routeBlacklist: config.routeBlacklist,
			})
			initialConfig.current = config

			toggleNotification({
				type: 'success',
				message: formatMessage({
					id: getTranslation('notification.settings.saved'),
					defaultMessage: 'Settings saved successfully',
				}),
			})
			setIsSaving(false)
		} catch (err) {
			setIsSaving(false)
			toggleNotification({
				type: 'danger',
				message:
					formatMessage({
						id: getTranslation('notification.error'),
						defaultMessage: 'An error occurred',
					}) +
					': ' +
					err,
			})
			console.error(err)
		}
	}

	if (loading) {
		return (
			<PageWrapper
				isSaving={isSaving}
				subtitle={formatMessage({
					id: getTranslation('loading'),
					defaultMessage: 'Loading...',
				})}
				disabledCondition={true}
			>
				<FullLoader height={200} />
			</PageWrapper>
		)
	}

	return (
		<Page.Protect permissions={pluginPermissions['settings.general']}>
			<PageWrapper
				save={save}
				isSaving={isSaving}
				subtitle={formatMessage({
					id: getTranslation('settings.page.general.subtitle'),
					defaultMessage: 'Configure general settings',
				})}
				disabledCondition={
					JSON.stringify(config) === JSON.stringify(initialConfig.current) ||
					hasMissingRouteSourceField
				}
			>
				<ContentBox
					title={formatMessage({
						id: getTranslation('settings.page.general.contentTypes'),
						defaultMessage: 'Content Types',
					})}
				>
					{config?.selectedContentTypes && config.selectedContentTypes.length > 0 ? (
						<Field.Root name="selectedContentTypesAccordion">
							<Field.Label>
								<SettingTitle>
									{formatMessage({
										id: getTranslation('settings.page.contentTypeSettings'),
										defaultMessage: 'Content Type settings',
									})}
								</SettingTitle>
							</Field.Label>
							<Accordion.Root>
								{config.selectedContentTypes?.map((contentTypeSettings: ConfigContentType) => {
									const ct: ContentType | undefined = allContentTypes?.find(
										(item) => item.uid === contentTypeSettings.uid,
									)
									return (
										<ContentTypeAccordion
											key={contentTypeSettings.uid}
											contentType={ct}
											contentTypeSettings={contentTypeSettings}
											dispatch={dispatch}
											allGroupedEntities={selectableEntities}
											entitiesLoading={entitiesLoading}
										/>
									)
								})}
							</Accordion.Root>
						</Field.Root>
					) : (
						<Typography>
							{formatMessage({
								id: getTranslation('settings.page.general.noContentTypesEnabled'),
								defaultMessage:
									'No content types are enabled for Webatlas. Please enable at least one content type to use this plugin.',
							})}
							<Link
								href="https://github.com/mattisvensson/strapi-plugin-webatlas?tab=readme-ov-file#-configuration"
								isExternal
								style={{ marginLeft: 4 }}
							>
								{formatMessage({
									id: getTranslation('settings.page.general.noContentTypesEnabled.moreInfo'),
									defaultMessage: 'More info',
								})}
							</Link>
						</Typography>
					)}
					<Box marginTop={4}>
						<Field.Root
							name="routeBlacklist"
							hint={formatMessage({
								id: getTranslation('settings.page.blacklist.hint'),
								defaultMessage:
									'Enter a comma-separated list of URL segments that should be blocked from being used in generated paths. For example, if you enter "admin, login", then any generated path that starts with "/admin" or "/login" will be blocked, while paths like "/admin-guide" stay allowed. The blacklist only applies to routes that are created or updated after saving — it does not affect existing routes.',
							})}
						>
							<Field.Label>
								<SettingTitle>
									{formatMessage({
										id: getTranslation('settings.page.blacklist.label'),
										defaultMessage: 'URL Blacklist',
									})}
								</SettingTitle>
							</Field.Label>
							<Field.Input
								type="text"
								placeholder={formatMessage({
									id: getTranslation('settings.page.blacklist.placeholder'),
									defaultMessage: 'Enter comma-separated URL segments to block',
								})}
								value={blacklistInput}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setBlacklistInput(e.target.value)
								}
								onBlur={() => {
									// Mirror the server-side normalization (normalizeRouteBlacklist) so that the
									// stored entries match the shape of generated paths
									const blacklist = blacklistInput
										.split(',')
										.map((s) => s.trim().toLowerCase().replace(/^\/+/, '').replace(/\/+$/, ''))
										.filter(Boolean)

									dispatch({ type: 'SET_ROUTE_BLACKLIST', payload: { blacklist } })
									setBlacklistInput(blacklist.join(', '))
								}}
							/>
							<Field.Hint />
						</Field.Root>
					</Box>
				</ContentBox>
				<ContentBox
					title={formatMessage({
						id: getTranslation('settings.page.general.details'),
						defaultMessage: 'Details',
					})}
				>
					<Field.Root name="selectedContentTypesAccordion">
						<Field.Label>
							<SettingTitle>
								{PLUGIN_NAME}{' '}
								{formatMessage({
									id: getTranslation('version'),
									defaultMessage: 'Version',
								})}
							</SettingTitle>
						</Field.Label>
						<Typography>
							v{PLUGIN_VERSION}
							<Link
								href={`https://github.com/mattisvensson/strapi-plugin-webatlas/releases/tag/v${PLUGIN_VERSION}`}
								target="_blank"
								rel="noopener noreferrer"
								style={{ marginLeft: 4 }}
							>
								<ExternalLink />
							</Link>
						</Typography>
					</Field.Root>
				</ContentBox>
			</PageWrapper>
		</Page.Protect>
	)
}

export default Settings
