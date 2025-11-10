import { Box, Typography } from '@strapi/design-system';
import { getTranslation } from '../utils';
import { useIntl } from 'react-intl';

interface URLInfoProps {
  validationState: 'initial' | 'checking' | 'done';
	replacement: string;
}

export default function URLInfo({validationState, replacement}: URLInfoProps) {

	const { formatMessage } = useIntl();

	if (validationState === 'initial') return null
	let color = 'neutral800'
	let text = formatMessage({
		id: getTranslation('components.URLInfo.checking'),
		defaultMessage: 'Checking if URL is available...',
	})

	if (validationState === 'checking') {
		color = 'neutral800'
		text = formatMessage({
			id: getTranslation('components.URLInfo.checking'),
			defaultMessage: 'Checking if URL is available...',
		})
	} else if (validationState === 'done') {
		color = replacement ? 'danger500' : 'success500'
		text = replacement ? 
			`${formatMessage({
				id: getTranslation('components.URLInfo.notAvailable'),
				defaultMessage: 'URL is not available. Replaced with',
			})} "${replacement}".` : 
			formatMessage({
				id: getTranslation('components.URLInfo.available'),
				defaultMessage: 'URL is available.',
			})
	}

	return (
		<Box paddingTop={2}>
			<Typography textColor={color}>{text}</Typography>
		</Box>
	)
}