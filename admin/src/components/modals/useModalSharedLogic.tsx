import { useState, useRef, useReducer, useCallback, useContext } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { GroupedEntities, RouteSettings, Entity, Route, modalSharedLogic } from '../../../../types';
import { useApi, useAllEntities } from '../../hooks';
import { debounce, duplicateCheck } from '../../utils';
import { transformToUrl } from '../../../../utils';

type PathState = {
	value?: string;
	prevValue?: string,
	uidPath?: string,
	initialPath?: string,
	needsUrlCheck: boolean;
};

type Action = 
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_INTERNAL'; payload: boolean }
  | { type: 'SET_OVERRIDE'; payload: boolean };

type PathAction = 
  | { type: 'DEFAULT'; payload: string }
  | { type: 'NO_URL_CHECK'; payload: string }
  | { type: 'NO_TRANSFORM_AND_CHECK'; payload: string }
  | { type: 'RESET_URL_CHECK_FLAG'; }
  | { type: 'SET_UIDPATH'; payload: string }
  | { type: 'SET_INITIALPATH'; payload: string }


function itemStateReducer(navItemState: RouteSettings, action: Action): RouteSettings {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...navItemState, title: action.payload };
    case 'SET_ACTIVE':
      return { ...navItemState, active: action.payload };
    case 'SET_INTERNAL':
      return { ...navItemState, internal: action.payload };
    case 'SET_OVERRIDE':
      return { ...navItemState, isOverride: action.payload };
    default:
      throw new Error();
  }
}

function pathReducer(state: PathState, action: PathAction): PathState {
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
    case 'SET_INITIALPATH':
      return { ...state, initialPath: action.payload };  
    default:
      throw new Error();
  }
}

export function useModalSharedLogic() {
  const [availableEntities, setAvailableEntities] = useState<GroupedEntities[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>();
  const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>();
  const [entityRoute, setEntityRoute] = useState<Route>();
  const [replacement, setReplacement] = useState<string>('');
  const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
  const { entities } = useAllEntities();
  const { createNavItem, updateRoute, getRouteByRelated, createExternalRoute } = useApi();

  const initialState: React.MutableRefObject<RouteSettings> = useRef({
    title: '',
    slug: '',
    active: true,
    internal: true,
    isOverride: false,
  });

  const [navItemState, dispatchItemState] = useReducer(itemStateReducer, initialState.current);
  const [path, dispatchPath] = useReducer(pathReducer, { needsUrlCheck: false });

  const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

  const { modalType, setModalType } = useContext(ModalContext);
  const { selectedNavigation } = useContext(SelectedNavigationContext);

  async function checkUrl(url: string, routeId?: number | null) {
		if (!url) return
    setValidationState('checking')
		setReplacement('')
		
		try {
			const data = await duplicateCheck(url, routeId)

			if (!data || data === url) return 

			dispatchPath({ type: 'NO_URL_CHECK', payload: data });
			setReplacement(data)
		} catch (err) {
			console.log(err)
		} finally {
      setValidationState('done')
    }
	}

  const modalSharedLogic: modalSharedLogic =  {
    availableEntities,
    setAvailableEntities,
    selectedEntity,
    setSelectedEntity,
    selectedContentType,
    setSelectedContentType,
    entityRoute,
    setEntityRoute,
    entities,
    createNavItem,
    createExternalRoute,
    updateRoute,
    getRouteByRelated,
    replacement,
    setReplacement,
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