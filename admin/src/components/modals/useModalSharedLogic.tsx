import type { ConfigContentType, RouteSettings } from '../../../../types'
import type {
	ExtendedPanelPathState,
	ExtendedPanelAction,
	navItemStateAction,
	modalSharedLogic,
	ValidationState,
} from '../../types'
import { useState, useRef, useReducer, useCallback, useContext, useMemo } from 'react'
import { ModalContext, SelectedNavigationContext, ContentTypesContext } from '../../contexts'
import { debounce, duplicateCheck } from '../../utils'
import { useFetchClient } from '@strapi/strapi/admin'

function navItemStateReducer(
	navItemState: RouteSettings,
	action: navItemStateAction,
): RouteSettings {
	switch (action.type) {
		case 'SET_TITLE':
			return { ...navItemState, title: action.payload }
		case 'SET_ACTIVE':
			return { ...navItemState, active: action.payload }
		case 'SET_OVERRIDE':
			return { ...navItemState, isOverride: action.payload }
		default:
			throw new Error()
	}
}

function pathReducer(
	state: ExtendedPanelPathState,
	action: ExtendedPanelAction,
): ExtendedPanelPathState {
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
		case 'SET_URL_CHECK_FLAG':
			return { ...state, needsUrlCheck: action.payload || false }
		case 'SET_REPLACEMENT':
			return { ...state, replacement: action.payload }
		case 'SET_UIDPATH':
			return { ...state, uidPath: action.payload }
		case 'SET_SLUG':
			return { ...state, slug: action.payload }
		case 'SET_CANONICALPATH':
			return { ...state, canonicalPath: action.payload }
		case 'SET_INITIALPATH':
			return { ...state, initialPath: action.payload }
		default:
			throw new Error()
	}
}

export function useModalSharedLogic() {
	const [selectedContentType, setSelectedContentType] = useState<ConfigContentType>()
	const [validationState, setValidationState] = useState<ValidationState>('initial')
	const [isBlacklisted, setIsBlacklisted] = useState(false)
	const { contentTypes } = useContext(ContentTypesContext)
	const { get } = useFetchClient()

	// Without a route source field no route can be generated, so the content type cannot be selected
	const availableContentTypes = useMemo(
		() => contentTypes.filter((contentType) => contentType.routeSourceField),
		[contentTypes],
	)

	const initialState: React.RefObject<RouteSettings> = useRef({
		title: '',
		slug: '',
		active: true,
		type: 'internal',
		isOverride: false,
	})

	const [navItemState, dispatchNavItemState] = useReducer(navItemStateReducer, initialState.current)
	const [path, dispatchPath] = useReducer(pathReducer, {
		needsUrlCheck: false,
		value: '',
		prevValue: '',
		slug: '',
		replacement: null,
		uidPath: '',
		canonicalPath: '',
		initialPath: '',
	})
	// Only the latest requested check counts, results of older checks are ignored
	const requestedUrlRef = useRef<string | null>(null)
	const debouncedRunUrlCheck = useCallback(debounce(checkUrl, 500), [])

	// Marks the path as being checked right away, so it cannot be saved before the delayed check ran
	const debouncedCheckUrl = useCallback((args: Parameters<typeof checkUrl>[0]) => {
		requestedUrlRef.current = args.url
		setValidationState('checking')
		debouncedRunUrlCheck(args)
	}, [])

	// For paths that need no check, e.g. the initial path: a pending check must not apply anymore
	const cancelUrlCheck = useCallback(() => {
		requestedUrlRef.current = null
		setValidationState('initial')
		dispatchPath({ type: 'SET_REPLACEMENT', payload: null })
	}, [])
	const debouncedCheckBlacklist = useCallback(debounce(checkBlacklist, 500), [])

	const { modalType, setModalType } = useContext(ModalContext)
	const { selectedNavigation } = useContext(SelectedNavigationContext)

	async function checkUrl({
		url,
		routeDocumentId,
		withoutTransform = false,
	}: {
		url: string
		routeDocumentId?: string | null
		withoutTransform?: boolean
	}) {
		if (!url || requestedUrlRef.current !== url) return
		dispatchPath({ type: 'SET_REPLACEMENT', payload: '' })

		try {
			const { uniquePath, blacklisted } = await duplicateCheck({
				fetchFunction: get,
				path: url,
				routeDocumentId,
				withoutTransform,
			})

			// The path changed while the check ran, a newer check is responsible
			if (requestedUrlRef.current !== url) return

			setIsBlacklisted(blacklisted)
			if (!blacklisted && uniquePath && uniquePath !== url) {
				dispatchPath({ type: 'NO_URL_CHECK', payload: uniquePath })
				dispatchPath({ type: 'SET_REPLACEMENT', payload: uniquePath })
				// The path of an item is built from its slug, so the slug has to match the replaced path
				dispatchPath({ type: 'SET_SLUG', payload: uniquePath.split('/').pop() ?? '' })
			}
			setValidationState('done')
		} catch (err) {
			if (requestedUrlRef.current !== url) return
			console.error(err)
			setValidationState('initial')
		}
	}

	// Kept separate from checkUrl: the blacklist has to be re-checked on every path change, while the
	// duplicate check only runs on the guarded needsUrlCheck transitions
	async function checkBlacklist({ url }: { url: string }) {
		if (!url) {
			setIsBlacklisted(false)
			return
		}

		try {
			const { blacklisted } = await duplicateCheck({
				fetchFunction: get,
				path: url,
				withoutTransform: true,
			})

			setIsBlacklisted(blacklisted)
		} catch (err) {
			console.error(err)
		}
	}

	const modalSharedLogic: modalSharedLogic = {
		availableContentTypes,
		selectedContentType,
		setSelectedContentType,
		contentTypes,
		validationState,
		setValidationState,
		isBlacklisted,
		initialState,
		navItemState,
		dispatchNavItemState,
		path,
		dispatchPath,
		debouncedCheckUrl,
		cancelUrlCheck,
		debouncedCheckBlacklist,
		modalType,
		setModalType,
		selectedNavigation,
	}

	return modalSharedLogic
}
