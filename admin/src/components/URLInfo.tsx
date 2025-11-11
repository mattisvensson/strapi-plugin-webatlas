import { Box, Typography } from '@strapi/design-system';
import { getTranslation } from '../utils';
import { useIntl } from 'react-intl';
import { useState, useEffect } from 'react';

interface URLInfoProps {
  validationState: 'initial' | 'checking' | 'done';
	replacement: string;
	setUrlStatus?: (isValid: 'valid' | 'invalid') => void;
}

export default function URLInfo({validationState, replacement, setUrlStatus}: URLInfoProps) {
	const [color, setColor] = useState<string | null>(null);
	const [text, setText] = useState<string | null>(null);
	const { formatMessage } = useIntl();

	useEffect(() => {
		if (validationState === 'initial') return
		if (validationState === 'checking') {
			setColor('neutral800')
			setText(formatMessage({
				id: getTranslation('components.URLInfo.checking'),
				defaultMessage: 'Checking if URL is available...',
			}))
		} else if (validationState === 'done') {
			setColor(replacement ? 'danger500' : 'success500')
			setText(replacement ? 
				`${formatMessage({
					id: getTranslation('components.URLInfo.notAvailable'),
					defaultMessage: 'URL is not available. Replaced with',
				})} "${replacement}".` : 
				formatMessage({
					id: getTranslation('components.URLInfo.available'),
					defaultMessage: 'URL is available.',
				}))
			if (setUrlStatus) setUrlStatus(replacement ? 'invalid' : 'valid');
		}
	}, [validationState, replacement, formatMessage, setUrlStatus]);

	return (
		<Box paddingTop={2}>
			<Typography textColor={color}>{text}</Typography>
		</Box>
	)
}