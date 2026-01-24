import { Checkbox, Box, Flex, Typography, Field, Divider } from '@strapi/design-system';
import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import transformToUrl from '../../../../utils/transformToUrl';
import { unstable_useContentManagerContext as useContentManagerContext, useFetchClient, useRBAC } from '@strapi/strapi/admin';
import { ConfigContentType, Route } from '../../../../types';
import Tooltip from '../Tooltip';
import debounce from '../../utils/debounce';
import PathInfo from '../PathInfo';
import duplicateCheck from '../../utils/duplicateCheck';
import { useApi } from '../../hooks'
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

type Action = 
  | { type: 'DEFAULT'; payload: string }
  | { type: 'NO_URL_CHECK'; payload: string }
  | { type: 'NO_TRANSFORM_AND_CHECK'; payload: string }
  | { type: 'RESET_URL_CHECK_FLAG'; }
  | { type: 'SET_UIDPATH'; payload: string }

type PathState = {
	value?: string;
	prevValue?: string,
	uIdPath?: string,
	needsUrlCheck: boolean;
};

function reducer(state: PathState, action: Action): PathState {
	switch (action.type) {
		case 'DEFAULT':
      return { 
				...state,
				value: transformToUrl(action.payload), 
				prevValue: state.value,
				needsUrlCheck: true 
			};
		case 'NO_URL_CHECK':
			return {
				...state,
				value: transformToUrl(action.payload), 
				prevValue: state.value,
				needsUrlCheck: false 
			};
		case 'NO_TRANSFORM_AND_CHECK':
			return { 
				...state,
				value: action.payload, 
				prevValue: state.value,
				needsUrlCheck: false 
			};
		case 'RESET_URL_CHECK_FLAG':
			return { ...state, needsUrlCheck: false };
		case 'SET_UIDPATH':
			return { ...state, uIdPath: action.payload };
		default:
			throw new Error();
	}
}

const Path = ({ config }: { config: ConfigContentType }) => {
	const { form, model } = useContentManagerContext()
	const { initialValues, values, onChange } = form;
	const { getRelatedRoute } = useApi()
	const { formatMessage } = useIntl();
	const { get } = useFetchClient();

	const { allowedActions: {
		canUpdate,
		canCreate
	}} = useRBAC([
		{
			action: 'plugin::content-manager.explorer.update',
			subject: model,
			properties: {},
			conditions: [],
		},
		{
			action: 'plugin::content-manager.explorer.create',
			subject: model,
			properties: {},
			conditions: [],
		},
	]);
	console.log('RBAC Actions:', { canUpdate, canCreate });

	const [routeId, setRouteId] = useState<number | null>()
	const [isOverride, setIsOverride] = useState(false);
	const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
	const [replacement, setReplacement] = useState<string>('');
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const [urlIsValid, setUrlIsValid] = useState<'valid' | 'invalid' | null>(null);
	const [path, dispatchPath] = useReducer(reducer, {
		needsUrlCheck: false,
		value: '',
		prevValue: '',
		uIdPath: ''
	});
  const hasUserChangedField = useRef(false);
	const initialPath = useRef('')
	const prevValueRef = useRef<string | null>(null);

	const debouncedCheckUrl = useCallback(debounce(checkUrl, 250), []);

	useEffect(() => {
		onChange('webatlas_path', path.value);
		onChange('webatlas_override', isOverride);
	}, [path.value, isOverride])

	const debouncedValueEffect = useMemo(() => debounce((currentValues: any) => {
		const key = config?.default;
		if (!key) return;

		const currentValue = currentValues[key];
		
		if (!currentValue) {
			dispatchPath({ type: 'NO_URL_CHECK', payload: '' });
			return;
		}

		// Only run automatic path generation if:
		// 1. Initial load is complete
		// 2. User has manually changed the field OR no route exists
		// 3. Not in override mode
		if (initialLoadComplete && 
				(hasUserChangedField.current || !routeId) && 
				prevValueRef.current !== currentValue && 
				!isOverride) {
			
			const path = config.pattern ? `${config.pattern}/${currentValue}` : `${currentValue}`;
			if (currentValue === initialValues[key]) {
				dispatchPath({ type: 'NO_URL_CHECK', payload: path });
			} else {
				dispatchPath({ type: 'DEFAULT', payload: path });
			}
			prevValueRef.current = currentValue;
		}
	}, 500), [config?.default, config?.pattern, initialValues, isOverride, initialLoadComplete, routeId]);

  // Track when user changes the source field
  useEffect(() => {
		const key = config?.default;
    if (!key) return;

		const currentValue = values[key];
    const initialValue = initialValues[key];

		if (currentValue && !isOverride) {
			const path = config.pattern ? `${config.pattern}/${currentValue}` : `${currentValue}`;
			onChange('webatlas_path', transformToUrl(path));
		}

    if (!initialLoadComplete) return;
        
    // Mark as user-changed if current value differs from initial value
    if (currentValue !== initialValue) {
      hasUserChangedField.current = true;
    }

		debouncedValueEffect(values);
  }, [values, debouncedValueEffect, initialLoadComplete]);


  useEffect(() => {
		if (path.needsUrlCheck && path.value) {
			if (path.uIdPath === path.value || initialPath.current === path.value) return
			debouncedCheckUrl(path.value);
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck]);

	useEffect(() => {
		async function getTypes() {
			if (!initialValues.documentId) {
        setInitialLoadComplete(true); // Mark as complete even if no route
        return;
      }			
			
			try {
				const route = await getRelatedRoute(initialValues.documentId)

				if (!route) return

				initialPath.current = initialValues.webatlas_path || route.uidPath
				setRouteId(route.id)
				setIsOverride(route.isOverride || false)
				
				dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: route.path || '' });
				dispatchPath({ type: 'SET_UIDPATH', payload: route.uidPath || '' });
			
				// Set the prevValueRef to prevent immediate override
				const key = config?.default;
        if (key) {
          prevValueRef.current = values[key];
        }
			} catch (err) {
				setRouteId(null)
				console.log(err)
			}
			setInitialLoadComplete(true); // Mark initial load as complete
		}
		getTypes()
	}, [config])

	useEffect(() => {
		if (initialValues.webatlas_path) dispatchPath({ type: 'NO_URL_CHECK', payload: initialValues.webatlas_path });
		if (initialValues.webatlas_override) setIsOverride(initialValues.webatlas_override);
	}, [])

	async function checkUrl(url: string) {
		if (!url) return
		setValidationState('checking')
		setReplacement('')
		
		try {
			const data = await duplicateCheck(get, url)

			if (!data || data === url) return 
			
			dispatchPath({ type: 'NO_URL_CHECK', payload: data });
			setReplacement(data)
		} catch (err) {
			console.log(err)
		} finally {
			setUrlIsValid(null);
			setValidationState('done')
		}
	}

	if (!initialLoadComplete) return (
    <Typography textColor="neutral600">
			{formatMessage({
        id: getTranslation('loading'),
        defaultMessage: 'Loading...',
      })}
    </Typography>
  )

	return (
		<Box
			as="aside"
			aria-labelledby="URL Route"
			width="100%"
		>
			<Flex
				direction='column'
				alignItems='stretch'
				gap={4}
			>
				<Box>
					{!routeId && 
						<>
							<Typography textColor="neutral600" marginBottom={2}>
								{formatMessage({
									id: getTranslation('components.CMEditViewAside.path.newPathInfo'),
									defaultMessage: 'A new path will be created upon saving this entry.',
								})}
							</Typography>
							<Box paddingBottom={2} paddingTop={2}>
								<Divider/>
							</Box>
						</>
					}
					<Field.Root
						hint={
							config.default ?
								formatMessage({
									id: getTranslation('components.CMEditViewAside.path.input.start'),
									defaultMessage: 'Edit the',
								})
								+ " \"" + config.default + "\" " +
								formatMessage({
									id: getTranslation('components.CMEditViewAside.path.input.end'),
									defaultMessage: 'field to generate a path',
								})
								:
								formatMessage({
									id: getTranslation('components.CMEditViewAside.path.input.noSourceField'),
									defaultMessage: 'Use the override option to set a custom path',
								})
						}
					>
						<Field.Label>
							{formatMessage({
								id: getTranslation('components.CMEditViewAside.path.input.label'),
								defaultMessage: 'Path',
							})}
							<Tooltip description={formatMessage({
								id: getTranslation('components.CMEditViewAside.path.input.tooltip'),
								defaultMessage: 'The following characters are valid: A-Z, a-z, 0-9, /, -, _, $, ., +, !, *, \', (, )',
							})} />
						</Field.Label>
						<Field.Input
							id="path-input"
							value={path.value}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
							disabled={!isOverride}
							onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
								if (e.target.value === path.prevValue) return
								dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
							}
							style={{ outline: urlIsValid !== null ? (urlIsValid === 'valid' ? "1px solid #5cb176" : "1px solid #ee5e52") : undefined }}
						/>
						<Field.Hint/>
					</Field.Root>
					<PathInfo validationState={validationState} replacement={replacement} setUrlStatus={setUrlIsValid} />
					<Flex
						gap={2}
						paddingTop={2}
					>
						<Checkbox
							id="path-override-checkbox"
							checked={isOverride}
							onCheckedChange={() => setIsOverride(prev => !prev)}
							disabled={(!routeId && !canCreate) || (routeId && !canUpdate)}
						>
							<Typography textColor="neutral600">
								{formatMessage({
									id: getTranslation('components.CMEditViewAside.path.overrideCheckbox'),
									defaultMessage: 'Override automatic path generation',
								})}
							</Typography>
						</Checkbox>
					</Flex>
				</Box>
				{path.uIdPath && (
					<>	
						<Box>
							<Divider/>
						</Box>
						<Box>
							<Field.Root
								hint={formatMessage({
									id: getTranslation('components.CMEditViewAside.path.uidPath.hint'),
									defaultMessage: 'Permanent UID path, cannot be changed',
								})}
							>
								<Field.Input
									value={path.uIdPath}
									disabled
								/>
								<Field.Hint/>
							</Field.Root>
						</Box>
					</>
				)}
			</Flex>
		</Box>
	)
};

export default Path;