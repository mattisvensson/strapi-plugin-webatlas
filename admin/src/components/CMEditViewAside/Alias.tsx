import { Checkbox, Box, Flex, Typography, Field, Divider } from '@strapi/design-system';
import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import transformToUrl from '../../../../utils/transformToUrl';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { ConfigContentType } from '../../../../types';
import Tooltip from '../Tooltip';
import debounce from '../../utils/debounce';
import URLInfo from '../URLInfo';
import duplicateCheck from '../../utils/duplicateCheck';
import { useApi } from '../../hooks'

type Action = 
  | { type: 'DEFAULT'; payload: string }
  | { type: 'NO_URL_CHECK'; payload: string }
  | { type: 'NO_TRANSFORM_AND_CHECK'; payload: string }
  | { type: 'RESET_URL_CHECK_FLAG'; }
  | { type: 'SET_UIDPATH'; payload: string }
  | { type: 'SET_DOCUMENTIDPATH'; payload: string }

type PathState = {
	value?: string;
	prevValue?: string,
	uIdPath?: string,
	documentIdPath?: string,
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
		case 'SET_DOCUMENTIDPATH':
			return { ...state, documentIdPath: action.payload };
		default:
			throw new Error();
	}
}

const Alias = ({ config }: { config: ConfigContentType }) => {
	const { layout, form } = useContentManagerContext()
	const { initialValues, values, onChange } = form;
	const { getRelatedRoute } = useApi()

	const [routeId, setRouteId] = useState<number | null>()
	const [isOverride, setIsOverride] = useState(false);
	const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
	const [replacement, setReplacement] = useState<string>('');
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const [path, dispatchPath] = useReducer(reducer, {
		needsUrlCheck: false,
		value: '',
		prevValue: '',
		uIdPath: ''
	});
  const hasUserChangedField = useRef(false);
	const initialPath = useRef('')
	const prevValueRef = useRef<string | null>(null);

	const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

	useEffect(() => {
		onChange('webatlas_path', path.value);
		onChange('webatlas_override', isOverride);
	}, [path.value, routeId, isOverride])

    const debouncedValueEffect = useMemo(
    () => debounce((currentValues: any) => {
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
    }, 500),
    [config?.default, config?.pattern, initialValues, isOverride, initialLoadComplete, routeId]
  );

  // Track when user changes the source field
  useEffect(() => {
		const key = config?.default;
    if (!key) return;

		const currentValue = values[key];
    const initialValue = initialValues[key];

		if (currentValue && !isOverride) {
			const path = config.pattern ? `${config.pattern}/${currentValue}` : `${currentValue}`;
			onChange('webatlas_path', path);
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

				initialPath.current = initialValues.webatlas_path || route.uIdPath
				setRouteId(route.id)
				setIsOverride(route.isOverride || false)
				
				dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: route.fullPath || '' });
				dispatchPath({ type: 'SET_UIDPATH', payload: route.uidPath || '' });
				dispatchPath({ type: 'SET_DOCUMENTIDPATH', payload: route.documentIdPath || '' });
			
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
			const data = await duplicateCheck(url)

			if (!data || data === url) return 
			
			dispatchPath({ type: 'NO_URL_CHECK', payload: data });
			setReplacement(data)
		} catch (err) {
			console.log(err)
		} finally {
			setValidationState('done')
		}
	}

	if (!initialLoadComplete) return (
    <Typography textColor="neutral600">
      Loading...
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
					<Field.Root hint={!initialValues.id && !config.default ? '[id] will be replaced with the entry ID' : ''}>
						<Field.Label>
							URL
							<Tooltip description="The following characters are valid: A-Z, a-z, 0-9, /, -, _, $, ., +, !, *, ', (, )" />
						</Field.Label>
						<Field.Input
							id="url-input"
							value={path.value}
							placeholder={config.default ? `Edit the "${config.default}" field to generate a URL` : `${layout.list.settings.displayName?.toLowerCase()}/[id]`}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
							disabled={!isOverride}
							onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
								if (e.target.value === path.prevValue) return
								dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
							}
						/>
						<Field.Hint/>
					</Field.Root>
					<URLInfo validationState={validationState} replacement={replacement} />
					<Flex
						gap={2}
						paddingTop={2}
					>
						<Checkbox
							id="override-url"
							checked={isOverride}
							onCheckedChange={() => setIsOverride(prev => !prev)}
						>
							<Typography textColor="neutral600">
								Override generated URL
							</Typography>
						</Checkbox>
					</Flex>
				</Box>
				{path.uIdPath && path.documentIdPath && (
					<>	
						<Box>
							<Divider/>
						</Box>
						<Box>
							<Field.Root
								hint="Permanent UID path, cannot be changed."
								label="UID path"
								>
								<Field.Label/>
								<Field.Input
									value={path.uIdPath}
									disabled
								/>
								<Field.Hint/>
							</Field.Root>
						</Box>
						<Box>
							<Field.Root
								hint="Permanent DocumentID path, cannot be changed."
								label="DocumentID path"
								>
								<Field.Label/>
								<Field.Input
									value={path.documentIdPath}
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

export default Alias;