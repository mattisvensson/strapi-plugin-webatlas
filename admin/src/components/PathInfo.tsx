import type { ValidationState } from '../types'
import { Box, Typography } from '@strapi/design-system'
import { getTranslation } from '../utils'
import { useIntl } from 'react-intl'
import { useState, useEffect } from 'react'

interface PathProps {
	validationState: ValidationState
	replacement: string | null
	isBlacklisted?: boolean
}

export default function PathInfo({ validationState, replacement, isBlacklisted }: PathProps) {
	const [color, setColor] = useState<string>('neutral800')
	const [text, setText] = useState<string | null>(null)
	const { formatMessage } = useIntl()

	useEffect(() => {
		if (isBlacklisted) {
			setColor('danger500')
			setText(
				formatMessage({
					id: getTranslation('components.pathInfo.blacklisted'),
					defaultMessage: 'This path is blocked by the URL blacklist and cannot be saved.',
				}),
			)
			return
		}

		if (validationState === 'initial') return
		if (validationState === 'checking') {
			setColor('neutral800')
			setText(
				formatMessage({
					id: getTranslation('components.pathInfo.checking'),
					defaultMessage: 'Checking if path is available...',
				}),
			)
		} else if (validationState === 'done') {
			setColor(replacement ? 'danger500' : 'success500')
			setText(
				replacement
					? `${formatMessage({
							id: getTranslation('components.pathInfo.notAvailable'),
							defaultMessage: 'Path is not available. Replaced with',
						})} "${replacement}".`
					: formatMessage({
							id: getTranslation('components.pathInfo.available'),
							defaultMessage: 'Path is available.',
						}),
			)
		}
	}, [validationState, replacement, isBlacklisted, formatMessage])

	return (
		<Box paddingTop={1}>
			<Typography textColor={color}>{text}</Typography>
		</Box>
	)
}
