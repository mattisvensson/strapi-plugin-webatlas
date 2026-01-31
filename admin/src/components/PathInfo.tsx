import { Box, Typography } from '@strapi/design-system';
import { getTranslation } from '../utils';
import { useIntl } from 'react-intl';
import { useState, useEffect } from 'react';

interface PathProps {
  validationState: 'initial' | 'checking' | 'done';
	replacement?: string;
	setUrlStatus?: (isValid: 'valid' | 'invalid') => void;
}

export default function PathInfo({validationState, replacement, setUrlStatus}: PathProps) {
	const [color, setColor] = useState<string | null>(null);
	const [text, setText] = useState<string | null>(null);
	const { formatMessage } = useIntl();

	useEffect(() => {
		if (validationState === 'initial') return
		if (validationState === 'checking') {
			setColor('neutral800')
			setText(formatMessage({
				id: getTranslation('components.pathInfo.checking'),
				defaultMessage: 'Checking if path is available...',
			}))
		} else if (validationState === 'done') {
			setColor(replacement ? 'danger500' : 'success500')
			setText(replacement ? 
				`${formatMessage({
					id: getTranslation('components.pathInfo.notAvailable'),
					defaultMessage: 'Path is not available. Replaced with',
				})} "${replacement}".` : 
				formatMessage({
					id: getTranslation('components.pathInfo.available'),
					defaultMessage: 'Path is available.',
				}))
			if (setUrlStatus) setUrlStatus(replacement ? 'invalid' : 'valid');
		}
	}, [validationState, replacement, formatMessage, setUrlStatus]);

	return (
		<Box paddingTop={1}>
			<Typography textColor={color}>{text}</Typography>
		</Box>
	)
}