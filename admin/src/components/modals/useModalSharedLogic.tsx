import { useState, useRef, useReducer, useCallback, useContext } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { GroupedEntities, RouteSettings, Entity, Route, modalSharedLogic, ModalAction, ModalPathAction, ModalPathState } from '../../../../types';
import { useApi, useAllEntities } from '../../hooks';
import { debounce, duplicateCheck } from '../../utils';
import { transformToUrl } from '../../../../utils';

function itemStateReducer(navItemState: RouteSettings, action: ModalAction): RouteSettings {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...navItemState, title: action.payload };
    case 'SET_SLUG':
      return { ...navItemState, slug: action.payload };
    case 'SET_VISIBILITY':
      return { ...navItemState, visible: action.payload };
    case 'SET_INTERNAL':
      return { ...navItemState, internal: action.payload };
    case 'SET_OVERRIDE':
      return { ...navItemState, isOverride: action.payload };
    default:
      throw new Error();
  }
}

function pathReducer(state: ModalPathState, action: ModalPathAction): ModalPathState {
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
  // TODO: Fetch entities only once and share between modals
  const { entities } = useAllEntities();
  const { updateRoute, getRelatedRoute } = useApi();

  const initialState: React.RefObject<RouteSettings> = useRef({
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

  async function checkUrl(url: string, routeDocumentId?: string | null) {
		if (!url) return
    setValidationState('checking')
		setReplacement('')
		
		try {
			const data = await duplicateCheck(url, routeDocumentId)

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
    updateRoute,
    getRelatedRoute,
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