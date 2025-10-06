import { Modal, Button, SingleSelect, SingleSelectOption, TextInput, Toggle, Box, Divider, Grid } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NavItemSettings, Entity, GroupedEntities, ModalItem_VariantCreate } from '../../../../../types';
import URLInfo from '../../URLInfo';
import { useEffect } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';

function ItemCreateComponent({ 
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
  updateRoute,
  getRouteByRelated,
  replacement,
  validationState,
  initialState,
  navItemState,
  dispatchItemState,
  path,
  dispatchPath,
  debouncedCheckUrl,
  setModalType,
  selectedNavigation,
  parentId,
}: ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>) {

  useEffect(() => {
    if (!entities) return
    setAvailableEntities(entities)
  }, [entities])

  useEffect(() => {
    if (path.needsUrlCheck && path.value) {
      if (path.uidPath === path.value || path.initialPath === path.value) return
			debouncedCheckUrl(path.value, entityRoute?.documentId);
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck, entityRoute?.documentId]);

  useEffect(() => {
    async function fetchRoute() {
      if (selectedContentType?.contentType && selectedEntity?.id) {
        try {
          const route = await getRouteByRelated(selectedContentType.contentType.uid, selectedEntity.id)

          if (!route) return

          dispatchPath({ type: 'NO_URL_CHECK', payload: route.fullPath });
          dispatchPath({ type: 'SET_UIDPATH', payload: route.uidPath });
          dispatchPath({ type: 'SET_INITIALPATH', payload: route.fullPath });

          dispatchItemState({ type: 'SET_TITLE', payload: route.title })
          dispatchItemState({ type: 'SET_ACTIVE', payload: route.active })
          dispatchItemState({ type: 'SET_INTERNAL', payload: route.internal })
          dispatchItemState({ type: 'SET_OVERRIDE', payload: route.isOverride })
          
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

  
  const addItem = async () => {
    try {
      if (!entityRoute || !selectedNavigation) return

      const settings: NavItemSettings = {
        route: entityRoute.id ?? null,
        parent: parentId ?? null,
        navigation: selectedNavigation.id,
      }

      if (path.value !== path.initialPath) {
        if (navItemState.slug !== entityRoute.fullPath) navItemState.isOverride = true
        await updateRoute({fullPath: path.value}, entityRoute.id)
      }

      await createNavItem(settings);

      setModalType('')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Modal.Root onClose={() => setModalType('')}>
      <Modal.Header title="Add new navigation item"/>
      <Modal.Body>
        <Grid gap={8}>
          <Grid.Item col={6}>
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
                availableEntities.map((group: GroupedEntities, index: number) =>
                  <SingleSelectOption key={index} value={group.label}>{group.label}</SingleSelectOption>)
              }
            </SingleSelect>
          </Grid.Item>
          <Grid.Item col={6}>
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
                  <SingleSelectOption key={entity.id} value={entity.id}>{entity.id} - {entity[selectedContentType.contentType.default]}</SingleSelectOption>
                )
              }
            </SingleSelect>
          </Grid.Item>
        </Grid>
        {selectedEntity && selectedContentType &&
          <>
            <Box paddingBottom={6} paddingTop={6}>
              <Divider/>
            </Box>
            <Box>
              <Grid gap={8} paddingBottom={6} >
                <Grid.Item col={6}>
                  <TextInput
                    placeholder="My Title"
                    label="Title"
                    name="title"
                    value={navItemState.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchItemState({ type: 'SET_TITLE', payload: e.target.value })}
                    required
                  />
                </Grid.Item>
                <Grid.Item col={6}>
                  <TextInput
                    required
                    placeholder="about/"
                    label="Path"
                    name="slug"
                    value={path?.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
                    onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.value === path.prevValue) return
                      dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
                    }
                  />
                  <URLInfo validationState={validationState} replacement={replacement} />
                </Grid.Item>
              </Grid>
              <Grid gap={8}>
                <Grid.Item col={6}>
                  <Toggle
                    label="Is visible?"
                    onLabel="Yes"
                    offLabel="No"
                    hint='This menu item does not show on your site, if set to "no".'
                    checked={navItemState.active}
                    onClick={() => dispatchItemState({ type: 'SET_ACTIVE', payload: !navItemState.active })}
                  />
                </Grid.Item>
              </Grid>
            </Box>
          </>
        }
      </Modal.Body>
      <Modal.Footer
        startActions={<Button onClick={() => setModalType('')} variant="tertiary">Cancel</Button>}
        endActions={
          <>
            <Button variant="secondary" onClick={() => setModalType('ExternalCreate')}>Add external link</Button>
            <Button variant="secondary" onClick={() => setModalType('WrapperCreate')}>Add wrapper component</Button>
            <Button disabled={!selectedEntity} onClick={() => addItem()}>Add item</Button>
          </>
        }
      />
    </Modal.Root>
  );
}

export const ItemCreate = withModalSharedLogic<ModalItem_VariantCreate>(ItemCreateComponent);