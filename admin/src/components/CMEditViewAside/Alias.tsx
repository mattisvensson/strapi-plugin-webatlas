import { BaseCheckbox, Box, TextInput, Flex, Divider, Typography } from '@strapi/design-system';
import { useState, useEffect, useRef, useCallback } from 'react';
import transformToUrl from '../../../../utils/transformToUrl';
import { useFetchClient, useCMEditViewDataManager } from '@strapi/helper-plugin';
import { ConfigContentType } from '../../../../types';
import Tooltip from '../../components/Tooltip';
import debounce from '../../utils/debounce';
import URLInfo from '../../components/URLInfo';

const Alias = ({ config }: { config: ConfigContentType }) => {
	const { layout, initialData, modifiedData, onChange } = useCMEditViewDataManager()
	const { get, post } = useFetchClient();

	const [routeId, setRouteId] = useState<number | null>()
	const [path, setPath] = useState('')
	const [isOverride, setIsOverride] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [finished, setFinished] = useState(false);
	const initialPath = useRef('')
	const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
	const [replacement, setReplacement] = useState<string>('');

	if (!config) return null

	useEffect(() => {
		setTimeout(() => {
			// TODO: Find a better way to handle onChange function
			setFinished(true)
		}, 500)
	}, [])

	useEffect(() => {
		if (!finished || isLoading) return
		onChange({ target: { name: "url_alias_path", value: path } })
		onChange({ target: { name: "url_alias_relatedContentType", value: layout.uid } })
		onChange({ target: { name: "url_alias_routeId", value: routeId || null } })
		onChange({ target: { name: "url_alias_relatedId", value: initialData.id || null } })
		onChange({ target: { name: "url_alias_isOverride", value: isOverride } })
	}, [path, isOverride])

	useEffect(() => {
		if (!finished || isLoading) return
		onChange({ target: { name: "url_alias_routeId", value: routeId || null } });

		if (!config?.default) return
		updateUrl(modifiedData[config?.default])
	}, [modifiedData[config?.default]]);

	useEffect(() => {
		if (!config) return
		setIsLoading(true)

		updateUrl('')

		async function getTypes() {
			if (!initialData.id) return setIsLoading(false);
			try {
				const { data } = await get(`/content-manager/collection-types/plugin::url-routes.route?filters[relatedId][$eq]=${initialData.id}`);
				const route = data.results.find((route: any) => route.defaultRoute === true)
				// console.log(route)
				if (!route) return setIsLoading(false);

				initialPath.current = route.fullPath ?? route.uidPath
				setRouteId(route.id)
				setIsOverride(route.isOverride || false)
				setPath(route.fullPath ?? route.uidPath)
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
			const { data } = await post('/url-routes/checkUniquePath', {
				path: transformToUrl(url)
			});

			if (!data || data === url) return 
			console.log("new url", data)
			setPath(data)
			setReplacement(data)
		} catch (err) {
			console.log(err)
		} finally {
			setValidationState('done')
		}
	}

	const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

	const updateUrl = (value: string, fromInput?: boolean) => {
		if ((isOverride && !fromInput)) return;

		if (value && fromInput) {
			setPath(transformToUrl(value))
		} else if (value) {
			setPath(`${config.pattern ? config.pattern : ''}${transformToUrl(value)}`);
		} else if (!value && fromInput) {
			setPath('')
		}
		if (!fromInput) debouncedCheckUrl(value)
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
						borderColor="success500"
						id="url-input"
						label="URL"
						hint={!initialData.id && !config.default && '[id] will be replaced with the entry ID'}
						labelAction={<Tooltip description="The following characters are valid: A-Z, a-z, 0-9, /, -, _, $, ., +, !, *, ', (, )" />}
						value={path}
						placeholder={config.default ? `Edit the "${config.default}" field to generate a URL` : `${layout.apiID}/[id]`}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUrl(e.target.value, true)}
						disabled={!isOverride}
						onBlur={() => debouncedCheckUrl(path)}
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
