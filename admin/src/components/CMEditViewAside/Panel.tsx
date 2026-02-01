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

function getCanonicalPath(selectedParent: Route | null, sourceFieldValue: string) {
	const parentPath = selectedParent ? selectedParent.canonicalPath + '/' : '';
	return `${parentPath}${transformToUrl(sourceFieldValue)}`
}

function reducer(state: PanelPathState, action: PanelAction): PanelPathState {
	switch (action.type) {
		case 'DEFAULT':
      return { 
				...state,
				value: action.payload, 
				prevValue: state.value,
				needsUrlCheck: true 
			};
		case 'NO_URL_CHECK':
			return {
				...state,
				value: action.payload, 
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
		case 'SET_REPLACEMENT':
			return { ...state, replacement: action.payload };
		case 'SET_UIDPATH':
			return { ...state, uIdPath: action.payload };
		case 'SET_CANONICALPATH':
			return { ...state, canonicalPath: action.payload };
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
	const [selectedParent, setSelectedParent] = useState<Route | null>(null);
	const [isOverride, setIsOverride] = useState(false);
	const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const [path, dispatchPath] = useReducer(reducer, {
		needsUrlCheck: false,
		value: '',
		prevValue: '',
		replacement: null,
		uIdPath: '',
		canonicalPath: '',
	});
  const hasUserChangedField = useRef(false);
	const initialPath = useRef('')
	const prevSourceValueRef = useRef<string | null>(null);
	const sourceFieldValue = useMemo(() => {
		const key = config?.default;
		if (!key) return '';

		const currentValue = values[key];
		if (!currentValue) return '';

		return currentValue
	}, [values, config]);

	const debouncedCheckPath = useCallback(debounce(checkPath, 250), []);
	const debouncedCheckCanonicalPath = useCallback(debounce(checkCanonicalPath, 250), []);

	useEffect(() => {
		onChange('webatlas_path', path.value);
		onChange('webatlas_override', isOverride);
		onChange('webatlas_parent', selectedParent?.documentId || null);
	}, [path.value, isOverride, selectedParent])

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
				prevSourceValueRef.current !== currentValue && 
				!isOverride) {
			
			const path = getCanonicalPath(selectedParent, currentValue);
			if (currentValue === initialValues[key]) {
				dispatchPath({ type: 'NO_URL_CHECK', payload: path });
			} else {
				dispatchPath({ type: 'DEFAULT', payload: path });
			}
			prevSourceValueRef.current = currentValue;
		}
	}, 500), [config?.default, initialValues, isOverride, initialLoadComplete, routeId, selectedParent]);

  // Track when user changes the source field
  useEffect(() => {
		const key = config?.default;
    if (!key) return;

		const currentValue = values[key];
    const initialValue = initialValues[key];

		if (currentValue && !isOverride) {
			onChange('webatlas_path', transformToUrl(currentValue));
		}

    if (!initialLoadComplete) return;
        
    // Mark as user-changed if current value differs from initial value
    if (currentValue !== initialValue) {
      hasUserChangedField.current = true;
    }

		debouncedValueEffect(values);
  }, [values, debouncedValueEffect, initialLoadComplete, selectedParent]);

  useEffect(() => {
		if (path.needsUrlCheck && path.value) {
			if (path.uIdPath === path.value || initialPath.current === path.value) return
			debouncedCheckPath(path.value);
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
			
				// Set the prevSourceValueRef to prevent immediate override
				const key = config?.default;
        if (key) {
          prevSourceValueRef.current = values[key];
        }
			} catch (err) {
				setRouteId(null)
				console.error(err)
			}
			setInitialLoadComplete(true); // Mark initial load as complete
		}
		getTypes()
	}, [config])

	useEffect(() => {
		if (initialValues.webatlas_parent && routes.length > 0 && !selectedParent) {
			const parentRoute = routes.find(route => route.documentId === initialValues.webatlas_parent);
			if (parentRoute) {
				setSelectedParent(parentRoute);
				const canonicalPath = getCanonicalPath(parentRoute, sourceFieldValue);
				dispatchPath({ type: 'DEFAULT', payload: canonicalPath });
			}
		}
	}, [initialValues, routes])

	useEffect(() => {
		if (initialValues.webatlas_path) dispatchPath({ type: 'NO_URL_CHECK', payload: initialValues.webatlas_path });
		if (initialValues.webatlas_override) setIsOverride(initialValues.webatlas_override);
	
		async function fetchAllRoutes() {
			const allRoutes = await getRoutes();
			setRoutes(allRoutes);
		}
		fetchAllRoutes();
	}, [])

	useEffect(() => {
		if (!sourceFieldValue || !routeId) return;

		const canonicalPath = getCanonicalPath(selectedParent, sourceFieldValue);
		dispatchPath({ type: 'DEFAULT', payload: canonicalPath });
		dispatchPath({ type: 'SET_CANONICALPATH', payload: canonicalPath });

		debouncedCheckCanonicalPath(canonicalPath, routeId)
		dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
	}, [selectedParent, sourceFieldValue, routeId])

	async function checkCanonicalPath(path: string, documentId: string | null) {
		if (!path) return
		
		try {
			const result = await duplicateCheck({fetchFunction: get, path, routeDocumentId: documentId, withoutTransform: true});

			dispatchPath({ type: 'SET_CANONICALPATH', payload: result });
		} catch (err) {
			console.error(err)
		}
	}

	async function checkPath(path: string) {
		if (!path) return
		setValidationState('checking')
		dispatchPath({ type: 'SET_REPLACEMENT', payload: '' });
		
		try {
			const data = await duplicateCheck({fetchFunction: get, path, routeDocumentId: routeId, withoutTransform: true});

			if (!data || data === path) return 
			
			dispatchPath({ type: 'NO_URL_CHECK', payload: data });
			dispatchPath({ type: 'SET_REPLACEMENT', payload: data });
		} catch (err) {
			console.error(err)
		} finally {
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
					canonicalPath={path.canonicalPath}
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
						config={config}
					/>
					{validationState !== 'initial' && <PathInfo
						validationState={validationState}
						replacement={path.replacement}
					/>}
				</Box>
				<OverrideCheckbox
					isOverride={isOverride}
					setIsOverride={setIsOverride}
					disabledCondition={!canCreate && !canUpdate}
				/>
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