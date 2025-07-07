import { Box, Typography } from '@strapi/design-system';

interface URLInfoProps {
  validationState: 'initial' | 'checking' | 'done';
	replacement: string;
}

export default function URLInfo({validationState, replacement}: URLInfoProps) {
	if (validationState === 'initial') return null
	let color = 'neutral800'
	let text = 'Checking if URL is available...'

	if (validationState === 'checking') {
		color = 'neutral800'
		text = 'Checking if URL is available...'
	} else if (validationState === 'done') {
		color = replacement ? 'danger500' : 'success500'
		text = replacement ? `URL is not available. Replaced with "${replacement}".` : 'URL is available'
	}

	return (
		<Box paddingTop={2}>
			<Typography textColor={color}>{text}</Typography>
		</Box>
	)
}