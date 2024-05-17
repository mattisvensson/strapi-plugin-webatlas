import { ModalLayout, ModalBody, ModalFooter, Button, SingleSelect, SingleSelectOption, TextInput, ToggleInput, Box, Divider, Grid, GridItem } from '@strapi/design-system';
import { useState, useContext, useEffect } from 'react';
import { ModalContext } from '../../contexts';
import ModalHeader from './ModalHeader';
import { Route, RouteSettings, Navigation, Entity, GroupedEntities } from '../../types';
import useAllEntities from '../../hooks/useAllEntities';
import useApi from '../../hooks/useApi';

export default function ItemCreate ({ fetchNavigations, navigation }: { fetchNavigations: () => void, navigation: Navigation}){
  const [availableEntities, setAvailableEntities] = useState<GroupedEntities[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>()
  const [selectedContentType, setSelectedContentType] = useState<GroupedEntities>()
  const [entityRoute, setEntityRoute] = useState<Route>()
  const [title, setTitle] = useState('')
  const [path, setPath] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const [isInternal, setIsInternal] = useState(true)
  const [isNewRoute, setIsNewRoute] = useState(false)
  const { entities } = useAllEntities();
  const { createRoute, updateRoute, getRouteByRelated } = useApi();

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
      if (selectedEntity && selectedEntity.id) {
        try {
          const { results } = await getRouteByRelated(selectedEntity.id)
          const route = results[0]

          if (!route) setIsNewRoute(true)

          setEntityRoute(route)
          setTitle(route ? route.title : '')
          setPath(route ? route.path : '')
          setIsVisible(route ? route.isVisible : true)
          setIsInternal(route ? route.isInternal : true)
        } catch (err) {
          console.log(err)
        }
      }
    }
    fetchRoute()
  }, [selectedEntity])

  const addItem = async () => {
    try {
      if (!entityRoute) return
      const settings: RouteSettings = {
        title,
        path,
        menuAttached: true,
        navigation: [navigation.id],
        relatedContentType: entityRoute.relatedContentType,
        relatedId: entityRoute.relatedId,
      }
      if (isNewRoute) {
        await createRoute(settings);
      } else {
        await updateRoute(settings, entityRoute.id);
      }
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
                console.log(route)
                if (route) setSelectedEntity(route);
              }}
              disabled={selectedContentType?.entities && selectedContentType?.entities.length === 0}
            >
              {selectedContentType &&
                selectedContentType.entities?.map((entity: Entity) =>
                  <SingleSelectOption key={entity.id} value={entity.id}>{entity.Title}</SingleSelectOption>
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
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    required
                  />
                </GridItem>
                <GridItem col={6}>
                  <TextInput
                    placeholder="about/"
                    label="Path"
                    name="path"
                    value={path}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)}
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
                    checked={isVisible}
                    onClick={() => setIsVisible(prev => !prev)}
                  />
                </GridItem>
                <GridItem col={6}>
                  <ToggleInput
                    label="Internal link?"
                    onLabel="Yes"
                    offLabel="No"
                    hint='If the url points to a page of your site, select "Yes". Else select "no".'
                    checked={isInternal}
                    onClick={() => setIsInternal(prev => !prev)}
                  />
                </GridItem>
              </Grid>
            </Box>
          </>
        }
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setOpenModal('')} variant="tertiary">Cancel</Button>}
        endActions={<Button onClick={() => addItem()}>Add item</Button>}
      />
    </ModalLayout>
  )
}
