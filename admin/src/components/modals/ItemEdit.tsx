  import { ModalLayout, ModalBody, ModalFooter, Button, TextInput, ToggleInput, Box, Divider, Grid, GridItem } from '@strapi/design-system';
  import { useState, useContext, useEffect, useReducer, useRef, useCallback } from 'react';
  import { ModalContext } from '../../contexts';
  import ModalHeader from './ModalHeader';
  import { GroupedEntities, NestedNavItem, RouteSettings } from '../../../../types';
  import useAllEntities from '../../hooks/useAllEntities';
  import useApi from '../../hooks/useApi';
  import transformToUrl from '../../../../utils/transformToUrl';
  import debounce from '../../utils/debounce';
  import duplicateCheck from '../../utils/duplicateCheck';
  import URLInfo from '../../components/URLInfo';

  type ItemOverviewProps = {
    item: NestedNavItem | undefined;
    fetchNavigations: () => void;
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
    | { type: 'SET_OVERRIDE'; payload: boolean };

  type PathAction = 
    | { type: 'DEFAULT'; payload: string }
    | { type: 'NO_URL_CHECK'; payload: string }
    | { type: 'NO_TRANSFORM_AND_CHECK'; payload: string }
    | { type: 'RESET_URL_CHECK_FLAG'; }
    | { type: 'SET_INITIALPATH'; payload: string }

  function reducer(itemState: RouteSettings, action: Action): RouteSettings {
    switch (action.type) {
      case 'SET_TITLE':
        return { ...itemState, title: action.payload };
      case 'SET_ACTIVE':
        return { ...itemState, active: action.payload };
      case 'SET_OVERRIDE':
        return { ...itemState, isOverride: action.payload };
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
      case 'SET_INITIALPATH':
        return { ...state, initialPath: action.payload };  
      default:
        throw new Error();
    }
  }

  export default function ItemEdit ({ item, fetchNavigations }: ItemOverviewProps){
    const initialState: React.MutableRefObject<RouteSettings> = useRef({
      title: item?.route.title,
      active: item?.route.active,
      isOverride: item?.route.isOverride,
    })
    
    const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>()
    const [validationState, setValidationState] = useState<'initial' | 'checking' | 'done'>('initial');
    const [replacement, setReplacement] = useState<string>('')
    const { entities } = useAllEntities();
    const { updateRoute } = useApi();
    const [itemState, dispatch] = useReducer(reducer, initialState.current);
    const [path, dispatchPath] = useReducer(pathReducer, {
      value: item?.route.fullPath,
      initialPath: item?.route.fullPath,
      needsUrlCheck: false
    });
    const { setModal } = useContext(ModalContext);

    const debouncedCheckUrl = useCallback(debounce(checkUrl, 500), []);

    if (!item) return null

    useEffect(() => {
      if (!entities) return

      const contentType = entities.find((group: GroupedEntities) => group.contentType.uid === item.route.relatedContentType)
      if (contentType) setSelectedContentType(contentType)
    }, [entities])

    useEffect(() => {
      if (path.needsUrlCheck && path.value) {
        if (path.uidPath === path.value || path.initialPath === path.value) return
        debouncedCheckUrl(path.value, item.route.id);
        dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
      }
    }, [path.needsUrlCheck, item.route.id]);

    
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

    const updateItem = async () => {
      try {
        if (JSON.stringify(itemState) === JSON.stringify(initialState.current) && path.value === path.initialPath) return
        
        if (itemState.slug !== item.route.fullPath) dispatch({ type: 'SET_OVERRIDE', payload: true })
        
        await updateRoute({
          ...itemState,
          slug: path.value
        }, item.route.id)

        fetchNavigations()
        setModal('')
      } catch (err) {
        console.log(err)
      }
    }

    if (!selectedContentType) return null

    return (
      <ModalLayout onClose={() => setModal('')}>
        <ModalHeader title={`Edit ${selectedContentType.label} "${item.route.title}"`}/>
        <ModalBody>
          <Grid gap={8}>
            <GridItem col={6}>
              <TextInput
                value={selectedContentType.label}
                label="Content Type"
                disabled
              />
            </GridItem>
            <GridItem col={6}>
              <TextInput
                value={`${item.route.relatedId} - ${item.route.title}`}
                label="Entity"
                disabled
              />
            </GridItem>
          </Grid>
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
                  value={itemState.title}
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
                  checked={itemState.active}
                  onClick={() => dispatch({ type: 'SET_ACTIVE', payload: !itemState.active })}
                />
              </GridItem>
            </Grid>
          </Box>
        </ModalBody>
        <ModalFooter
          startActions={<Button onClick={() => setModal('')} variant="tertiary">Cancel</Button>}
          endActions={<Button onClick={() => updateItem()} disabled={JSON.stringify(itemState) === JSON.stringify(initialState.current) && path.value === path.initialPath}>Save</Button>}
        />
      </ModalLayout>
    )
  }
