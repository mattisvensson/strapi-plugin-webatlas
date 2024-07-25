import { ModalLayout, ModalBody, ModalFooter, Button, SingleSelect, SingleSelectOption, TextInput, ToggleInput, Box, Divider, Grid, GridItem } from '@strapi/design-system';
import { useState, useContext, useEffect, useReducer, useRef } from 'react';
import { ModalContext } from '../../contexts';
import ModalHeader from './ModalHeader';
import { Route, NavItemSettings, NestedNavigation, Entity, GroupedEntities, NestedNavItem, RouteSettings } from '../../../../types';
import useAllEntities from '../../hooks/useAllEntities';
import useApi from '../../hooks/useApi';
import transformToUrl from '../../../../utils/transformToUrl';

type ItemOverviewProps = {
  item: NestedNavItem | undefined;
  fetchNavigations: () => void;
  navigation: NestedNavigation;
  parentId?: number;
}

type Action = 
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SLUG'; payload: string }
  | { type: 'SET_ACTIVE'; payload: boolean }
  | { type: 'SET_INTERNAL'; payload: boolean }
  | { type: 'SET_OVERRIDE'; payload: boolean };


export default function ItemEdit ({ item, fetchNavigations, navigation, parentId }: ItemOverviewProps){
  const [availableEntities, setAvailableEntities] = useState<GroupedEntities[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>()
  const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>()
  const [entityRoute, setEntityRoute] = useState<Route>()
  const { entities } = useAllEntities();
  const { getRouteByRelated, updateRoute } = useApi();

  const initialState: React.MutableRefObject<RouteSettings> = useRef({
    title: '',
    slug: '',
    active: true,
    internal: true,
    isOverride: false,
  })

  const [navItemState, dispatch] = useReducer(reducer, initialState.current);

  function reducer(navItemState: RouteSettings, action: Action): RouteSettings {
    switch (action.type) {
      case 'SET_TITLE':
        return { ...navItemState, title: action.payload };
      case 'SET_SLUG':
        return { ...navItemState, slug: transformToUrl(action.payload) };
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

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }

  useEffect(() => {
    if (!entities) return
    setAvailableEntities(entities)

    if (!item) return

    const contentType = entities.find((group: GroupedEntities) => group.contentType.uid === item.route.relatedContentType)
    if (contentType) {
      setSelectedContentType(contentType)
      const entity = contentType.entities.find((entity: Entity) => entity.id === item.route.relatedId)
      if (entity) setSelectedEntity(entity)
    }
  }, [entities])

  useEffect(() => {
    async function fetchRoute() {
      if (selectedContentType?.contentType && selectedEntity?.id) {
        try {
          const { results } = await getRouteByRelated(selectedContentType.contentType.uid, selectedEntity.id)
          const route = results[0]

          if (!route) return

          dispatch({ type: 'SET_TITLE', payload: route.title })
          dispatch({ type: 'SET_SLUG', payload: route.fullPath })
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

  const updateItem = async () => {
    try {
      if (!entityRoute) return

      if (JSON.stringify(navItemState) !== JSON.stringify(initialState.current)) {
        if (navItemState.slug !== entityRoute.fullPath) navItemState.isOverride = true
        await updateRoute(navItemState, entityRoute.id)
      }

      fetchNavigations()
      setOpenModal('')
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <ModalLayout onClose={() => setOpenModal('')}>
      <ModalHeader title="Edit navigation item"/>
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
                  console.log(contentType)
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
                console.log(route)
                if (route) setSelectedEntity(route);
              }}
              disabled={selectedContentType?.entities && selectedContentType?.entities.length === 0}
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
                    placeholder="about/"
                    label="Path"
                    name="slug"
                    value={navItemState.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_SLUG', payload: e.target.value })}
                    required
                  />
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
        endActions={<Button onClick={() => updateItem()} disabled={JSON.stringify(navItemState) === JSON.stringify(initialState.current)}>Save</Button>}
      />
    </ModalLayout>
  )
}
