import type { ConfigContentType, Route } from '../../../../types';
import type { PanelAction, PanelPathState } from '../../types';
import { Box, Flex, Typography, Divider } from '@strapi/design-system';
import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import { debounce, duplicateCheck, getTranslation } from '../../utils';
import { transformToUrl } from '../../../../utils';
import { unstable_useContentManagerContext as useContentManagerContext, useFetchClient, useRBAC } from '@strapi/strapi/admin';
import PathInfo from '../PathInfo';
import { useApi } from '../../hooks'
import { useIntl } from 'react-intl';
import OverrideCheckbox from './OverrideCheckbox';
import NewPathInfo from './NewPathInfo';
import UidPathDisplay from './UidPathDisplay';
import PathInput from './PathInput';
import RouteStructure from './RouteStructure';

function reducer(state: PanelPathState, action: PanelAction): PanelPathState {
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

const Panel = ({ config }: { config: ConfigContentType }) => {
	const { form, model } = useContentManagerContext()
	const { initialValues, values, onChange } = form;
	const { getRelatedRoute, getRoutes } = useApi()
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

	const [routeId, setRouteId] = useState<string | null>(null);
	const [routes, setRoutes] = useState<Route[]>([]);
	const [selectedParent, setSelectedParent] = useState<string | null>(null);
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

	const generateFieldValue = useMemo(() => {
		const key = config?.default;
		if (!key) return '';

		const currentValue = values[key];
		if (!currentValue) return '';

		return transformToUrl(currentValue)
	}, [values, config]);

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
				setRouteId(route.documentId)
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
		if (initialValues.webatlas_parent) setSelectedParent(initialValues.webatlas_parent);
	
		async function fetchAllRoutes() {
			const allRoutes = await getRoutes();
			setRoutes(allRoutes);
		}
		fetchAllRoutes();
	}, [])

	useEffect(() => {
		if (selectedParent === null) return;
		onChange('webatlas_parent', selectedParent);
	}, [selectedParent])

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
				gap={1}
			>
				{!routeId && <>
					<NewPathInfo />
					<Divider marginTop={2} marginBottom={2} />
				</>}
				<RouteStructure
					slug={generateFieldValue}
					routeId={routeId}
					routes={routes}
					selectedParent={selectedParent}
					setSelectedParent={setSelectedParent}
				/>
				<Divider marginTop={2} marginBottom={2} />
				<Box>
					<PathInput
						path={path}
						dispatchPath={dispatchPath}
						isOverride={isOverride}
						urlIsValid={urlIsValid}
						config={config}
					/>
					{validationState !== 'initial' && <PathInfo validationState={validationState} replacement={replacement} setUrlStatus={setUrlIsValid} />}
				</Box>
				<OverrideCheckbox isOverride={isOverride} setIsOverride={setIsOverride} disabledCondition={!canCreate && !canUpdate} />
				{path.uIdPath && <>
					<Divider marginTop={2} marginBottom={2} />
					<UidPathDisplay path={path.uIdPath} />
				</>
				}
			</Flex>
		</Box>
	)
};

export default Panel;