import { Checkbox, Box, Flex, Typography, Field, TextInput } from '@strapi/design-system';
import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
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

type PathState = {
	value?: string;
	prevValue?: string,
	uidPath?: string,
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
			return { ...state, uidPath: action.payload };
		default:
			throw new Error();
	}
}

const Alias = ({ config }: { config: ConfigContentType }) => {
	const { model, layout, form } = useContentManagerContext()
	const { initialValues, values, onChange } = form;
	const { getRouteByRelated } = useApi()

	const [routeId, setRouteId] = useState<number | null>()
	const [isOverride, setIsOverride] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [finished, setFinished] = useState(false);
	const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
	const [replacement, setReplacement] = useState<string>('');
	const initialPath = useRef('')
	const prevValueRef = useRef(null);
	const [path, dispatchPath] = useReducer(reducer, {needsUrlCheck: false});

	if (!config) return null

	const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

	useEffect(() => {
		setTimeout(() => {
			// TODO: Find a better way to handle onChange function
			setFinished(true)
		}, 500)
	}, [])

	useEffect(() => {
		if (config.apiField)
			onChange(config.apiField, path.value);

		if (!finished || isLoading) return;

		onChange('webatlas_path', path.value);
		onChange('webatlas_override', isOverride);
	}, [path.value, routeId, isOverride])

	useEffect(() => {
		const key = config?.default
		if (!key) return

		const currentValue = values[key];

		if (!currentValue) return dispatchPath({ type: 'NO_URL_CHECK', payload: '' });

		if (prevValueRef.current !== currentValue && !isOverride) {
			const path = config.pattern ? `${config.pattern}/${values[key]}` : `${values[key]}`
			if (values[key] === initialValues[key]) {
				dispatchPath({ type: 'NO_URL_CHECK', payload: path });
			} else {
				dispatchPath({ type: 'DEFAULT', payload: path });
			}
			prevValueRef.current = currentValue;
		}
	}, [values, config?.default, isOverride]);

  useEffect(() => {
		if (path.needsUrlCheck && path.value) {
			if (path.uidPath === path.value || initialPath.current === path.value) return
			debouncedCheckUrl(path.value);
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck]);

	useEffect(() => {
		setIsLoading(true)

		async function getTypes() {
			if (!initialValues.id) return setIsLoading(false);
			try {
				const route = await getRouteByRelated(model, initialValues.id)

				if (!route) return setIsLoading(false);

				initialPath.current = route.fullPath || route.uidPath
				setRouteId(route.id)
				setIsOverride(route.isOverride || false)
				dispatchPath({ type: 'NO_URL_CHECK', payload: initialPath.current });
				dispatchPath({ type: 'SET_UIDPATH', payload: route.uidPath });
			} catch (err) {
				setRouteId(null)
				console.log(err)
			}
			setIsLoading(false);
		}
		getTypes()
	}, [config])

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

	if (isLoading) return null;

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
						<TextInput
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
							value={isOverride}
							onCheckedChange={() => setIsOverride(prev => !prev)}
						>
							<Typography textColor="neutral600">
								Override generated URL
							</Typography>
						</Checkbox>
					</Flex>
				</Box>
			</Flex>
		</Box>
	)
};

export default Alias;