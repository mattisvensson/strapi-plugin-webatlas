import { ModalLayout, ModalBody, ModalFooter, Button, SingleSelect, SingleSelectOption, TextInput, ToggleInput, Box, Divider, Grid, GridItem } from '@strapi/design-system';
import { useState, useContext, useEffect, useReducer, useRef, useCallback } from 'react';
import { ModalContext } from '../../contexts';
import ModalHeader from './ModalHeader';
import { Route, NavItemSettings, NestedNavigation, Entity, GroupedEntities, NestedNavItem, RouteSettings } from '../../../../types';
import useAllEntities from '../../hooks/useAllEntities';
import useApi from '../../hooks/useApi';
import transformToUrl from '../../../../utils/transformToUrl';
import duplicateCheck from '../../utils/duplicateCheck';
import debounce from '../../utils/debounce';
import URLInfo from '../../components/URLInfo';

type ItemOverviewProps = {
  fetchNavigations: () => void;
  navigation: NestedNavigation;
  parentId?: number;
}

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


function reducer(navItemState: RouteSettings, action: Action): RouteSettings {
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

export default function ItemCreate ({ fetchNavigations, navigation, parentId }: ItemOverviewProps){
  const [availableEntities, setAvailableEntities] = useState<GroupedEntities[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>()
  const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>()
  const [entityRoute, setEntityRoute] = useState<Route>()
  const { entities } = useAllEntities();
  const { createNavItem, updateRoute, getRouteByRelated } = useApi();
  const [replacement, setReplacement] = useState<string>('')
  const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');

  const initialState: React.MutableRefObject<RouteSettings> = useRef({
    title: '',
    slug: '',
    active: true,
    internal: true,
    isOverride: false,
  })

  const [navItemState, dispatch] = useReducer(reducer, initialState.current);
  const [path, dispatchPath] = useReducer(pathReducer, {needsUrlCheck: false});

  const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }

  useEffect(() => {
    if (!entities) return
    setAvailableEntities(entities)
  }, [entities])

  useEffect(() => {
    async function fetchRoute() {
      if (selectedContentType?.contentType && selectedEntity?.id) {
        try {
          const { results } = await getRouteByRelated(selectedContentType.contentType.uid, selectedEntity.id)
          const route = results[0]

          if (!route) return
          console.log(route)

          dispatchPath({ type: 'NO_URL_CHECK', payload: route.fullPath });
          dispatchPath({ type: 'SET_UIDPATH', payload: route.uidPath });
          dispatchPath({ type: 'SET_INITIALPATH', payload: route.fullPath });

          dispatch({ type: 'SET_TITLE', payload: route.title })
          dispatch({ type: 'SET_ACTIVE', payload: route.active })
          dispatch({ type: 'SET_INTERNAL', payload: route.internal })
          dispatch({ type: 'SET_OVERRIDE', payload: route.isOverride })
          
          initialState.current = {
            title: route.title,
            slug: route.fullPath,
            active: route.active,
            internal: route.internal,
            isOverride: route.isOverride,
          }

          setEntityRoute(route)
        } catch (err) {
          console.log(err)
        }
      }
    }
    fetchRoute()
  }, [selectedEntity])
  
  useEffect(() => {
		if (path.needsUrlCheck && path.value) {
			if (path.uidPath === path.value || path.initialPath === path.value) return
			debouncedCheckUrl(path.value);
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck]);

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


  const addItem = async () => {
    try {
      if (!entityRoute) return

      const settings: NavItemSettings = {
        route: entityRoute.id ?? null,
        parent: parentId ?? null,
        navigation: navigation.id,
      }

      if (path.value !== path.initialPath) {
        if (navItemState.slug !== entityRoute.fullPath) navItemState.isOverride = true
        await updateRoute({fullPath: path.value}, entityRoute.id)
      }

      await createNavItem(settings);

      fetchNavigations()
      setOpenModal('')
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <ModalLayout onClose={() => setOpenModal('')}>
      <ModalHeader title="Add new navigation item"/>
      <ModalBody>
        <Grid gap={8}>
          <GridItem col={6}>
            <SingleSelect
              value={selectedContentType ? selectedContentType.label : ''}
              label="Content Type"
              placeholder="Select a content type"
              onChange={(value: string) => {
                const [contentType] = availableEntities.filter((group: GroupedEntities) => group.label === value)
                if (contentType) {
                  setSelectedContentType(contentType)
                  setSelectedEntity(null)
                }
              }}
              disabled={availableEntities && availableEntities.length === 0}
            >
              {availableEntities &&
                availableEntities.map((group: GroupedEntities, index) =>
                  <SingleSelectOption key={index} value={group.label}>{group.label}</SingleSelectOption>)
              }
            </SingleSelect>
          </GridItem>
          <GridItem col={6}>
            <SingleSelect
              value={selectedEntity ? selectedEntity.id : ''}
              label="Entity"
              placeholder="Select a entity"
              onChange={(value: number) => {
                const flatEntities = availableEntities.flatMap((group: GroupedEntities) => group.entities);
                const route = flatEntities.find((route: Entity) => route.id === Number(value));
                if (route) setSelectedEntity(route);
              }}
              disabled={!selectedContentType || (selectedContentType?.entities && selectedContentType?.entities.length === 0)}
            >
              {selectedContentType &&
                selectedContentType.entities?.map((entity: Entity) =>
                  <SingleSelectOption key={entity.id} value={entity.id}>{entity.id} - {entity.Title}</SingleSelectOption>
                )
              }
            </SingleSelect>
          </GridItem>
        </Grid>
        {selectedEntity && selectedContentType &&
          <>
            <Box paddingBottom={6} paddingTop={6}>
              <Divider/>
            </Box>
            <Box>
              <Grid gap={8} paddingBottom={6} >
                <GridItem col={6}>
                  <TextInput
                    placeholder="My Title"
                    label="Title"
                    name="title"
                    value={navItemState.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                    required
                  />
                </GridItem>
                <GridItem col={6}>
                  <TextInput
                    required
                    placeholder="about/"
                    label="Path"
                    name="slug"
                    value={path.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
                    onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.value === path.prevValue) return
                      dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
                    }
                  />
                  <URLInfo validationState={validationState} replacement={replacement} />
                </GridItem>
              </Grid>
              <Grid gap={8}>
                <GridItem col={6}>
                  <ToggleInput
                    label="Is visible?"
                    onLabel="Yes"
                    offLabel="No"
                    hint='This menu item does not show on your site, if set to "no".'
                    checked={navItemState.active}
                    onClick={() => dispatch({ type: 'SET_ACTIVE', payload: !navItemState.active })}
                  />
                </GridItem>
              </Grid>
            </Box>
          </>
        }
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setOpenModal('')} variant="tertiary">Cancel</Button>}
        endActions={
          <>
            <Button variant="secondary" onClick={() => setOpenModal('externalCreate')}>Add external link</Button>
            <Button variant="secondary" onClick="">Add wrapper component</Button>
            <Button disabled={!selectedEntity} onClick={() => addItem()}>Add item</Button>
          </>
        }
      />
    </ModalLayout>
  )
}
