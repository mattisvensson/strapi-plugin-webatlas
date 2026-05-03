import type { ConfigContentType } from '../../../../types'
import { useState, useEffect } from 'react'
import { useRBAC } from '@strapi/strapi/admin'
import type { PanelComponent, PanelComponentProps } from '@strapi/content-manager/strapi-admin'
import { Typography } from '@strapi/design-system'
import { usePluginConfig, useAllContentTypes } from '../../hooks'
import Panel from './Panel'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'
import pluginPermissions from '../../permissions'
import { PLUGIN_NAME } from '../../../../utils'

const CMEditViewAside: PanelComponent = ({ model }: PanelComponentProps) => {
	const { contentTypes } = useAllContentTypes()
	const { config } = usePluginConfig()
	const { formatMessage } = useIntl()

	const [isAllowedContentType, setIsAllowedContentType] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [contentTypeConfig, setContentTypeConfig] = useState<ConfigContentType | null>(null)
	const [isActiveContentType, setIsActiveContentType] = useState(false)

	const panelTitle = PLUGIN_NAME

	useEffect(() => {
		const contentType = contentTypes?.find((ct) => ct.uid === model)
		setIsAllowedContentType(!!contentType?.pluginOptions?.webatlas?.enabled)
	}, [contentTypes, model])

	useEffect(() => {
		if (!config) return

		// Reset state first
		setIsActiveContentType(false)
		setContentTypeConfig(null)

		config?.selectedContentTypes?.forEach((type) => {
			if (type.uid === model) {
				setIsActiveContentType(true)
				setContentTypeConfig(type)
			}
		})
		setIsLoading(false)
	}, [config, model])

	const {
		allowedActions: { canAside },
	} = useRBAC({
		cmAside: pluginPermissions['cm.aside'],
	})

	if (!canAside || !isAllowedContentType || !isActiveContentType || !contentTypeConfig) return null

	if (!config) {
		strapi.log.error('CMEditViewAside: Plugin is not configured.')
		return null
	}

	if (isLoading)
		return {
			title: panelTitle,
			content: (
				<Typography textColor="neutral600">
					{formatMessage({
						id: getTranslation('loading'),
						defaultMessage: 'Loading...',
					})}
				</Typography>
			),
		}

	return {
		title: panelTitle,
		content: <Panel config={contentTypeConfig} />,
	}
}

export default CMEditViewAside
