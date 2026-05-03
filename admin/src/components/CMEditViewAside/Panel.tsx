import type { ConfigContentType, Route } from '../../../../types'
import type { PanelAction, PanelPathState, ValidationState } from '../../types'
import { Box, Flex, Typography, Divider } from '@strapi/design-system'
import { useState, useEffect, useRef, useReducer } from 'react'
import { debounce, duplicateCheck, getTranslation } from '../../utils'
import { transformToUrl } from '../../../../utils'
import {
	unstable_useContentManagerContext as useContentManagerContext,
	useFetchClient,
	useRBAC,
} from '@strapi/strapi/admin'
import PathInfo from '../PathInfo'
import { useApi } from '../../hooks'
import { useIntl } from 'react-intl'
import OverrideCheckbox from './OverrideCheckbox'
import NewPathInfo from './NewPathInfo'
import UidPathDisplay from './UidPathDisplay'
import PathInput from './PathInput'
import RouteStructure from './RouteStructure'

function buildPath(type: 'canonical' | 'path', slug: string, parent: Route | null) {
	const parentSlug = type === 'canonical' ? parent?.canonicalPath : parent?.path
	const parentPath = parentSlug ? `${parentSlug}/` : ''
	return `${parentPath}${transformToUrl(slug)}`
}

function reducer(state: PanelPathState, action: PanelAction): PanelPathState {
	switch (action.type) {
		case 'DEFAULT':
			return {
				...state,
				value: action.payload,
				prevValue: state.value,
				needsUrlCheck: true,
			}
		case 'NO_URL_CHECK':
			return {
				...state,
				value: action.payload,
				prevValue: state.value,
				needsUrlCheck: false,
			}
		case 'NO_TRANSFORM_AND_CHECK':
			return {
				...state,
				value: action.payload,
				prevValue: state.value,
				needsUrlCheck: false,
			}
		case 'RESET_URL_CHECK_FLAG':
			return { ...state, needsUrlCheck: false }
		case 'SET_REPLACEMENT':
			return { ...state, replacement: action.payload }
		case 'SET_UIDPATH':
			return { ...state, uidPath: action.payload }
		case 'SET_SLUG':
			return { ...state, slug: action.payload }
		case 'SET_CANONICALPATH':
			return { ...state, canonicalPath: action.payload }
		case 'SET_OVERRIDEPATH':
			return { ...state, overridePath: action.payload }
		default:
			throw new Error()
	}
}

const Panel = ({ config }: { config: ConfigContentType }) => {
	const { form, model } = useContentManagerContext()
	const { initialValues, values, onChange } = form as {
		initialValues: Record<string, any>
		values: Record<string, any>
		onChange: (eventOrPath: React.ChangeEvent<any> | string, value?: any) => void
	}
	const { getRelatedRoute, getAllRoutes, getProhibitedRouteIds } = useApi()
	const { formatMessage } = useIntl()
	const { get } = useFetchClient()
	const {
		allowedActions: { canUpdate, canCreate },
	} = useRBAC([
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
	])

	const [route, setRoute] = useState<Route | null>(null)
	const [routes, setRoutes] = useState<Route[]>([])
	const [prohibitedRouteIds, setProhibitedRouteIds] = useState<string[]>([])
	const [selectedParent, setSelectedParent] = useState<Route | null>(null)
	const [isOverride, setIsOverride] = useState(false)
	const [validationState, setValidationState] = useState<ValidationState>('initial')
	const [initialLoadComplete, setInitialLoadComplete] = useState(false)
	const [path, dispatchPath] = useReducer(reducer, {
		needsUrlCheck: false,
		value: '',
		prevValue: '',
		replacement: null,
		uidPath: '',
		canonicalPath: '',
		slug: '',
		overridePath: '',
	})
	const hasUserChangedField = useRef(false)
	const hasUserInteracted = useRef(false)
	const initialPath = useRef('')
	const prevSourceValueRef = useRef<string | null>(null)
	const sourceFieldValue = values[config?.default] || ''
	const initialSourceFieldValue = initialValues[config?.default] || ''

	const latestCheckPathRef = useRef<typeof checkPath>(checkPath)
	latestCheckPathRef.current = checkPath
	const debouncedCheckPath = useRef(
		debounce((p: string, id: string | null) => latestCheckPathRef.current(p, id), 250),
	).current

	const latestCheckCanonicalRef = useRef<typeof checkCanonicalPath>(checkCanonicalPath)
	latestCheckCanonicalRef.current = checkCanonicalPath
	const debouncedCheckCanonicalPath = useRef(
		debounce((p: string, id: string | null) => latestCheckCanonicalRef.current(p, id), 250),
	).current

	useEffect(() => {
		async function fetchAllRoutes() {
			const allRoutes = await getAllRoutes()
			setRoutes(allRoutes)
		}
		fetchAllRoutes()
	}, [])

	// Update override and parent entry fields when they changes
	// Only update path field when override mode is enabled
	useEffect(() => {
		const slug = transformToUrl(sourceFieldValue)
		const overridePath = transformToUrl(path.overridePath || '', false)
		const data = {
			path: isOverride ? overridePath : path.value,
			isOverride,
			parentDocumentId: selectedParent?.documentId || null,
			slug: isOverride ? overridePath : slug,
		}
		if (hasUserChangedField.current || hasUserInteracted.current) {
			onChange('webatlas', data)
		}
	}, [
		path.value,
		path.overridePath,
		isOverride,
		selectedParent,
		sourceFieldValue,
		hasUserChangedField,
		hasUserInteracted,
	])

	// Track when user changes the source field
	useEffect(() => {
		if (!initialLoadComplete) return

		// Mark as user-changed if current value differs from initial value
		if (sourceFieldValue !== initialSourceFieldValue) {
			hasUserChangedField.current = true
		}

		if (!sourceFieldValue) {
			dispatchPath({ type: 'NO_URL_CHECK', payload: '' })
			return
		}

		// Only run automatic path generation if:
		// 1. Initial load is complete
		// 2. User has manually changed the field OR no route exists
		// 3. Not in override mode
		if (
			initialLoadComplete &&
			(hasUserChangedField.current || !route) &&
			prevSourceValueRef.current !== sourceFieldValue &&
			!isOverride
		) {
			const newPath = buildPath('path', sourceFieldValue, selectedParent)
			const type = sourceFieldValue === initialSourceFieldValue ? 'NO_URL_CHECK' : 'DEFAULT'
			const slug = transformToUrl(sourceFieldValue)

			dispatchPath({ type, payload: newPath })
			dispatchPath({ type: 'SET_SLUG', payload: slug })
			dispatchPath({ type: 'SET_OVERRIDEPATH', payload: slug })
			prevSourceValueRef.current = sourceFieldValue
		}

		const canonicalPath = buildPath('canonical', sourceFieldValue, selectedParent)
		dispatchPath({ type: 'SET_CANONICALPATH', payload: canonicalPath })
		debouncedCheckCanonicalPath(canonicalPath, route?.documentId || null)
	}, [
		sourceFieldValue,
		initialSourceFieldValue,
		initialLoadComplete,
		selectedParent,
		isOverride,
		route,
	])

	// Initiate path check
	useEffect(() => {
		if (!initialLoadComplete) return
		if (path.needsUrlCheck && path.value) {
			if (path.uidPath === path.value || initialPath.current === path.value) return
			debouncedCheckPath(path.value, route?.documentId || null)
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' })
		} else {
			setValidationState('idle')
			dispatchPath({ type: 'SET_REPLACEMENT', payload: null })
		}
	}, [path.needsUrlCheck, path.value, path.uidPath, route, initialLoadComplete])

	// Fetch related route on initial load
	useEffect(() => {
		async function fetchRelatedRute() {
			if (!initialValues.documentId) {
				setInitialLoadComplete(true) // Mark as complete even if no route
				return
			}

			try {
				const route = await getRelatedRoute(initialValues.documentId)
				if (!route) return

				initialPath.current = route.uidPath

				setRoute(route)
				setIsOverride(route.isOverride || false)

				dispatchPath({ type: 'SET_OVERRIDEPATH', payload: route.path || '' })
				dispatchPath({
					type: 'NO_TRANSFORM_AND_CHECK',
					payload: route.path || '',
				})
				dispatchPath({ type: 'SET_UIDPATH', payload: route.uidPath || '' })
				dispatchPath({ type: 'SET_SLUG', payload: route.slug || '' })
				dispatchPath({
					type: 'SET_CANONICALPATH',
					payload: route.canonicalPath || '',
				})

				// Set the prevSourceValueRef to prevent immediate override
				const key = config?.default
				if (key) {
					prevSourceValueRef.current = values[key]
				}
			} catch (err) {
				setRoute(null)
				strapi.log.error(err)
			} finally {
				setInitialLoadComplete(true) // Mark initial load as complete
			}
		}
		fetchRelatedRute()
	}, [config])

	// set selected parent based on initial value
	useEffect(() => {
		if (!route || !routes.length) return
		const parentRoute = routes.find(
			(singleRoute) => singleRoute.documentId === route.parent?.documentId,
		)
		setSelectedParent(parentRoute || null)
	}, [route, routes])

	useEffect(() => {
		async function fetchProhibitedRouteIds() {
			const prohibitedIds = await getProhibitedRouteIds(route?.documentId)
			setProhibitedRouteIds(prohibitedIds)
		}
		fetchProhibitedRouteIds()
	}, [route])

	// Update path when parent changes
	useEffect(() => {
		if (
			!sourceFieldValue ||
			isOverride ||
			(!hasUserChangedField.current && !hasUserInteracted.current)
		)
			return

		const newPath = buildPath('path', sourceFieldValue, selectedParent)
		dispatchPath({ type: 'DEFAULT', payload: newPath })
	}, [selectedParent, sourceFieldValue, route, isOverride])

	async function checkCanonicalPath(path: string, routeDocumentId: string | null) {
		if (!path) return

		try {
			const result = await duplicateCheck({
				fetchFunction: get,
				path,
				routeDocumentId,
				withoutTransform: true,
			})

			dispatchPath({ type: 'SET_CANONICALPATH', payload: result })
		} catch (err) {
			strapi.log.error(err)
		}
	}

	async function checkPath(path: string, routeDocumentId: string | null) {
		if (!path) return
		setValidationState('checking')
		dispatchPath({ type: 'SET_REPLACEMENT', payload: '' })

		try {
			const data = await duplicateCheck({
				fetchFunction: get,
				path,
				routeDocumentId,
				withoutTransform: true,
			})

			if (!data || data === path) return

			dispatchPath({ type: 'NO_URL_CHECK', payload: data })
			dispatchPath({ type: 'SET_REPLACEMENT', payload: data })
		} catch (err) {
			strapi.log.error(err)
		} finally {
			setValidationState('done')
		}
	}

	if (!initialLoadComplete)
		return (
			<Typography textColor="neutral600">
				{formatMessage({
					id: getTranslation('loading'),
					defaultMessage: 'Loading...',
				})}
			</Typography>
		)

	return (
		<Box tag="aside" aria-labelledby="URL Route" width="100%">
			<Flex direction="column" alignItems="stretch" gap={1}>
				{!route && (
					<>
						<NewPathInfo />
						<Divider marginTop={2} marginBottom={2} />
					</>
				)}
				<RouteStructure
					canonicalPath={path.canonicalPath}
					routes={routes}
					selectedParent={selectedParent}
					setSelectedParent={(val) => {
						hasUserInteracted.current = true
						setSelectedParent(val)
					}}
					prohibitedRouteIds={prohibitedRouteIds}
				/>
				<Divider marginTop={2} marginBottom={2} />
				<Box>
					<PathInput
						path={path}
						dispatchPath={dispatchPath}
						isOverride={isOverride}
						config={config}
					/>
					{validationState !== 'initial' && (
						<PathInfo validationState={validationState} replacement={path.replacement} />
					)}
				</Box>
				<OverrideCheckbox
					isOverride={isOverride}
					setIsOverride={(val) => {
						hasUserInteracted.current = true
						setIsOverride(val)
					}}
					disabledCondition={!canCreate && !canUpdate}
				/>
				{path.uidPath && (
					<>
						<Divider marginTop={2} marginBottom={2} />
						<UidPathDisplay path={path.uidPath} />
					</>
				)}
			</Flex>
		</Box>
	)
}

export default Panel
