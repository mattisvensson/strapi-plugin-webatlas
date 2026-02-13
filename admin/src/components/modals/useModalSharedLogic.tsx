import type { GroupedEntities, RouteSettings, modalSharedLogic } from '../../../../types';
import type { PanelPathState, PanelAction } from '../../types';
import { useState, useRef, useReducer, useCallback, useContext, useMemo } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { useAllEntities } from '../../hooks';
import { debounce, duplicateCheck } from '../../utils';
import { useFetchClient } from '@strapi/strapi/admin';

type Action = 
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SLUG'; payload: string }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_OVERRIDE'; payload: boolean }

function itemStateReducer(navItemState: RouteSettings, action: Action): RouteSettings {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...navItemState, title: action.payload };
    case 'SET_SLUG':
      return { ...navItemState, slug: action.payload };
    case 'SET_ACTIVE':
      return { ...navItemState, active: action.payload };
    case 'SET_OVERRIDE':
      return { ...navItemState, isOverride: action.payload };
    default:
      throw new Error();
  }
}

type ExtendedPanelPathState = PanelPathState & {
  initialPath: string
};

type ExtendedPanelAction = PanelAction | { type: 'SET_INITIALPATH'; payload: string };

function pathReducer(state: ExtendedPanelPathState, action: ExtendedPanelAction): ExtendedPanelPathState {
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
    case 'SET_INITIALPATH':
      return { ...state, initialPath: action.payload };
    default:
      throw new Error();
  }
}

export function useModalSharedLogic() {
  const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>();
  const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
  // TODO: Fetch entities only once and share between modals
  const { entities } = useAllEntities();
  const { get } = useFetchClient();

  const availableEntities = useMemo(() => {
    if (!entities) return [];
    return entities
  }, [entities]);

  const initialState: React.RefObject<RouteSettings> = useRef({
    title: '',
    slug: '',
    active: true,
    internal: true,
    isOverride: false,
  });

  const [navItemState, dispatchItemState] = useReducer(itemStateReducer, initialState.current);
  const [path, dispatchPath] = useReducer(pathReducer, {
		needsUrlCheck: false,
		value: '',
		prevValue: '',
		replacement: null,
		uIdPath: '',
		canonicalPath: '',
    initialPath: '',
	});

  const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

  const { modalType, setModalType } = useContext(ModalContext);
  const { selectedNavigation } = useContext(SelectedNavigationContext);

  async function checkUrl(url: string, routeDocumentId?: string | null) {
		if (!url) return
    setValidationState('checking')
		dispatchPath({ type: 'SET_REPLACEMENT', payload: '' });
		
		try {
			const data = await duplicateCheck({fetchFunction: get, path: url, routeDocumentId})

			if (!data || data === url) return 

			dispatchPath({ type: 'NO_URL_CHECK', payload: data });
			dispatchPath({ type: 'SET_REPLACEMENT', payload: data });
		} catch (err) {
			console.log(err)
		} finally {
      setValidationState('done')
    }
	}

  const modalSharedLogic: modalSharedLogic =  {
    availableEntities,
    selectedContentType,
    setSelectedContentType,
    entities,
    validationState,
    setValidationState,
    initialState,
    navItemState,
    dispatchItemState,
    path,
    dispatchPath,
    debouncedCheckUrl,
    modalType,
    setModalType,
    selectedNavigation,
  };

  return modalSharedLogic
}