import { BaseCheckbox, Box, TextInput, Flex, Divider, Typography } from '@strapi/design-system';
import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import transformToUrl from '../../../../utils/transformToUrl';
import { useFetchClient, useCMEditViewDataManager } from '@strapi/helper-plugin';
import { ConfigContentType } from '../../../../types';
import Tooltip from '../Tooltip';
import debounce from '../../utils/debounce';
import URLInfo from '../URLInfo';
import duplicateCheck from '../../utils/duplicateCheck';

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
	const { layout, initialData, modifiedData, onChange } = useCMEditViewDataManager()
	const { get } = useFetchClient();

	const [routeId, setRouteId] = useState<number | null>()
	const [isOverride, setIsOverride] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [finished, setFinished] = useState(false);
	const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
	const [replacement, setReplacement] = useState<string>('');
	const initialPath = useRef('')
	const prevModifiedDataValueRef = useRef();
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
		if (!finished || isLoading) return
		onChange({ target: { name: "url_alias_path", value: path.value } })
		onChange({ target: { name: "url_alias_relatedContentType", value: layout.uid } })
		onChange({ target: { name: "url_alias_routeId", value: routeId || null } })
		onChange({ target: { name: "url_alias_relatedId", value: initialData.id || null } })
		onChange({ target: { name: "url_alias_isOverride", value: isOverride } })
	}, [path.value, routeId, isOverride])

	useEffect(() => {
		const key = config?.default
		if (!key) return

		const currentModifiedDataValue = modifiedData[key];

		if (prevModifiedDataValueRef.current !== currentModifiedDataValue && !isOverride) {
			if (modifiedData[key] === initialData[key]) {
				dispatchPath({ type: 'NO_URL_CHECK', payload: modifiedData[key] });
			} else {
				dispatchPath({ type: 'DEFAULT', payload: modifiedData[key] });
			}
			prevModifiedDataValueRef.current = currentModifiedDataValue;
		}
	}, [modifiedData, config?.default, isOverride]);

  useEffect(() => {
		if (path.needsUrlCheck && path.value) {
			if (path.uidPath === path.value || initialPath.current === path.value) return
			debouncedCheckUrl(path.value);
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck]);

	useEffect(() => {
		if (!config) return
		setIsLoading(true)

		async function getTypes() {
			if (!initialData.id) return setIsLoading(false);
			try {
				const { data } = await get(`/content-manager/collection-types/plugin::webatlas.route?filters[relatedId][$eq]=${initialData.id}`);
				const route = data.results[0]

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
			background='neutral0'
			borderColor="neutral150"
			hasRadius
			paddingBottom={4}
			paddingLeft={4}
			paddingRight={4}
			paddingTop={6}
			shadow="tableShadow"
		>
			<Typography
				variant="sigma"
				textColor="neutral600"
				id="url-route"
				paddingBottom={4}
			>
				URL Alias
			</Typography>
			<Box
				paddingTop={2}
				paddingBottom={4}
			>
				<Divider />
			</Box>
			<Flex
				direction='column'
				alignItems='stretch'
				gap={4}
			>
				<Box>
					<TextInput
						id="url-input"
						label="URL"
						hint={!initialData.id && !config.default && '[id] will be replaced with the entry ID'}
						labelAction={<Tooltip description="The following characters are valid: A-Z, a-z, 0-9, /, -, _, $, ., +, !, *, ', (, )" />}
						value={path.value}
						placeholder={config.default ? `Edit the "${config.default}" field to generate a URL` : `${layout.apiID}/[id]`}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
						disabled={!isOverride}
						onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
							if (e.target.value === path.prevValue) return
							dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
						}
					/>
					<URLInfo validationState={validationState} replacement={replacement} />
					<Flex
						gap={2}
						paddingTop={2}
					>
						<BaseCheckbox
							id="override-url"
							checked={isOverride}
							onChange={() => setIsOverride(prev => !prev)}
						/>
						<label htmlFor='override-url'>
							<Typography textColor="neutral600">
								Override generated URL
							</Typography>
						</label>
					</Flex>
				</Box>
			</Flex>
		</Box>
	)
};

export default Alias;
