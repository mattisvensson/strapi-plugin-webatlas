import { BaseCheckbox, Box, TextInput, Flex, Divider, Typography } from '@strapi/design-system';
import { useState, useEffect, useRef } from 'react';
import transformToUrl from '../../../../utils/transformToUrl';
import { useFetchClient, useCMEditViewDataManager } from '@strapi/helper-plugin';
import { ConfigContentType } from '../../../../types';

const Alias = ({ config }: { config: ConfigContentType }) => {
	const { layout, initialData, modifiedData, onChange } = useCMEditViewDataManager()
	const { get } = useFetchClient();

	const [routeId, setRouteId] = useState<number | null>()
	const [path, setPath] = useState('')
	const [isOverride, setIsOverride] = useState(false);
	const [isLoading,setIsLoading] = useState(true);
	const [finished, setFinished] = useState(false);
	const modifiedDataCopy = useRef('')

	if (!config || !config.default) return null

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
	}, [modifiedData[config?.default]]);

	useEffect(() => {
		if (!config?.default) return
		modifiedDataCopy.current = JSON.stringify(modifiedData)
		updateUrl(modifiedData[config?.default])
	}, [modifiedData])

	useEffect(() => {
		if (!config) return
		setIsLoading(true)

		updateUrl('')

		async function getTypes() {
			if (!initialData.id) return setIsLoading(false);
			try {
				const { data } = await get(`/content-manager/collection-types/plugin::url-routes.route?filters[relatedId][$eq]=${initialData.id}`);
				const route = data.results.find((route: any) => route.defaultRoute === true)
				
				setRouteId(route.id)
				setIsOverride(route.isOverride || false)
				if (route.fullPath) setPath(route.fullPath)
			} catch (err) {
				setRouteId(null)
				console.log(err)
			}
			setIsLoading(false);
		}
		getTypes()
	}, [config])

	const updateUrl = (value: string, fromInput?: boolean) => {
		if (isOverride && !fromInput) return;

		fromInput ? 
			setPath(transformToUrl(value)) :
			setPath(`${config.pattern}/${transformToUrl(value)}`);
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
						value={path}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateUrl(e.target.value, true)}
						disabled={!isOverride}
						error={path === '' ? 'This field is required' : undefined}
						required
					/>
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
