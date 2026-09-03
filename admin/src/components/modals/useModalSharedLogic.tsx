import type { GroupedEntities, RouteSettings } from '../../../../types'
import type {
	ExtendedPanelPathState,
	ExtendedPanelAction,
	navItemStateAction,
	modalSharedLogic,
	ValidationState,
} from '../../types'
import { useState, useRef, useReducer, useCallback, useContext, useMemo } from 'react'
import { ModalContext, SelectedNavigationContext } from '../../contexts'
import { useAllEntities } from '../../hooks'
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
	const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>()
	const [validationState, setValidationState] = useState<ValidationState>('initial')
	const [isBlacklisted, setIsBlacklisted] = useState(false)
	// TODO: Fetch entities only once and share between modals
	const { entities } = useAllEntities()
	const { get } = useFetchClient()

	// Without a route source field no route can be generated, so the content type cannot be selected
	const availableEntities = useMemo(() => {
		if (!entities) return []
		return entities.filter((group) => group.contentType.routeSourceField)
	}, [entities])

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

	const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), [])
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
		if (!url) return
		setValidationState('checking')
		dispatchPath({ type: 'SET_REPLACEMENT', payload: '' })

		try {
			const { uniquePath, blacklisted } = await duplicateCheck({
				fetchFunction: get,
				path: url,
				routeDocumentId,
				withoutTransform,
			})

			setIsBlacklisted(blacklisted)
			if (blacklisted) return

			if (!uniquePath || uniquePath === url) return

			dispatchPath({ type: 'NO_URL_CHECK', payload: uniquePath })
			dispatchPath({ type: 'SET_REPLACEMENT', payload: uniquePath })
		} catch (err) {
			strapi.log.error(err)
		} finally {
			setValidationState('done')
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
			strapi.log.error(err)
		}
	}

	const modalSharedLogic: modalSharedLogic = {
		availableEntities,
		selectedContentType,
		setSelectedContentType,
		entities,
		validationState,
		setValidationState,
		isBlacklisted,
		initialState,
		navItemState,
		dispatchNavItemState,
		path,
		dispatchPath,
		debouncedCheckUrl,
		debouncedCheckBlacklist,
		modalType,
		setModalType,
		selectedNavigation,
	}

	return modalSharedLogic
}
