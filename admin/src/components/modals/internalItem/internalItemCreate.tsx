import { SingleSelect, SingleSelectOption, Box, Divider, Grid, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import type { Entity, GroupedEntities, ModalItem_VariantCreate } from '../../../../../types';
import URLInfo from '../../URLInfo';
import { useEffect, useState } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';
import { NavModal } from '../'
import { useIntl } from 'react-intl';
import { getTranslation, createTempNavItemObject } from '../../../utils';
import { FullLoader } from '../../UI';

// TODO: Let the user select if the parent slug should be inherited or not
// TODO: Add hint if a route is added that already exists in a navigation (because there is only one path per route)

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
  getRelatedRoute,
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
  onCreate,
}: ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>) {
  const [loading, setLoading] = useState(false)
  const [loadingRoute, setLoadingRoute] = useState(true)
  const { formatMessage } = useIntl();

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
      if (!selectedContentType?.contentType || !selectedEntity?.documentId) return
      
      setLoadingRoute(true)
      try {
        const route = await getRelatedRoute(selectedEntity.documentId)

        // TODO: Create a route if not existing or show error
        if (!route) throw new Error('No route found for the selected entity')

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
      } finally {
        setLoadingRoute(false)
      }
    }
    fetchRoute()
  }, [selectedEntity])
  
  const addItem = async () => {
    try {
      setLoading(true)

      if (!selectedContentType?.contentType || !selectedEntity?.documentId || !path || !path.value?.trim() || !navItemState.title || !navItemState.title?.trim() || !selectedNavigation || !entityRoute) return

      // TODO: Handle route update if path changed
      // if (path.value !== path.initialPath) {
      //   if (navItemState.slug !== entityRoute.fullPath) navItemState.isOverride = true
      //   await updateRoute({fullPath: path.value}, entityRoute.documentId)
      //   settings.routeUpdate = { fullPath: path.value }
      // }

      const newItem = createTempNavItemObject({
        parentId,
        entityRoute,
        selectedNavigation,
        navItemState,
        selectedEntity,
        selectedContentType,
        path
      })
      onCreate(newItem)

      setModalType('')
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function ItemDetails() {
    if (loadingRoute) return <FullLoader height={50}/>
    return (
      <>
        <Grid.Root gap={4}>
          <Grid.Item col={6} s={12} alignItems="baseline">
            <Box width="100%">
              <Field.Root>
                <Field.Label>
                  {formatMessage({
                    id: getTranslation('modal.item.titleField.label'),
                    defaultMessage: 'Title'
                  })}
                </Field.Label>
                <Field.Input
                  placeholder={formatMessage({
                    id: getTranslation('modal.item.titleField.placeholder'),
                    defaultMessage: 'e.g. About us'
                  })}
                  name="title"
                  value={navItemState.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchItemState({ type: 'SET_TITLE', payload: e.target.value })}
                  required
                />
              </Field.Root>
            </Box>
          </Grid.Item>
          <Grid.Item col={6} s={12}>
            <Box width="100%">
              <Field.Root>
                <Field.Label>
                  {formatMessage({
                    id: getTranslation('modal.item.routeField.label'),
                    defaultMessage: 'Route'
                  })}
                </Field.Label>
                <Field.Input
                  required
                  placeholder={formatMessage({
                    id: getTranslation('modal.item.routeField.placeholder'),
                    defaultMessage: 'e.g. about/'
                  })}
                  name="slug"
                  value={path?.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
                  onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value === path.prevValue) return
                    dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
                  }
  
                />
              </Field.Root>
              <URLInfo validationState={validationState} replacement={replacement} />
            </Box>
          </Grid.Item>
        </Grid.Root>
        {/* TODO: Add visibility toggle to navitem schema */}
        {/* <Grid.Root gap={8}>
          <Grid.Item col={6} s={12}>
            <Box width="100%">
              <Field.Root hint="This menu item does not show on your site, if set to 'Hidden'">
                <Field.Label>Visibility</Field.Label>
                <Toggle
                  onLabel="Visible"
                  offLabel="Hidden"
                  checked={navItemState.active}
                  onClick={() => dispatchItemState({ type: 'SET_ACTIVE', payload: !navItemState.active })}
                />
                <Field.Hint/>
              </Field.Root>
            </Box>
          </Grid.Item>
        </Grid.Root> */}
      </>
    )
  }

  if (availableEntities && availableEntities.length === 0) {
    return <NavModal
      confirmText={formatMessage({ id: getTranslation('add'), defaultMessage: 'Add' })}
      closeText={formatMessage({ id: getTranslation('cancel'), defaultMessage: 'Cancel' })}
      titleText={formatMessage({ id: getTranslation('modal.internalItem.titleText.create'), defaultMessage: 'Add new navigation item' })}
      footer={<></>}
    >
      <FullLoader height={50}/>
    </NavModal>
  }

  return (
    <NavModal
      confirmText={formatMessage({ id: getTranslation('add'), defaultMessage: 'Add' })}
      closeText={formatMessage({ id: getTranslation('cancel'), defaultMessage: 'Cancel' })}
      titleText={formatMessage({ id: getTranslation('modal.internalItem.titleText.create'), defaultMessage: 'Add new navigation item' })}
      loadingText={formatMessage({ id: getTranslation('modal.internalItem.loadingText.create'), defaultMessage: 'Creating' })}
      onConfirm={addItem}
      loading={loading}
      modalToOpen=''
      currentModalType="ItemCreate"
      currentModalMode={'create'}
      disabled={!selectedContentType?.contentType || !selectedEntity?.documentId || !path || !path.value?.trim() || !navItemState.title || !navItemState.title?.trim()}
    >
      <Grid.Root gap={4}>
        <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.internalItem.contentType.label'),
                  defaultMessage: 'Content Type'
                })}
              </Field.Label>
              <SingleSelect
                value={selectedContentType ? selectedContentType.contentType.label : ''}
                placeholder={formatMessage({
                  id: getTranslation('modal.internalItem.contentType.placeholder'),
                  defaultMessage: 'Select a content type'
                })}
                onChange={(value: string) => {
                  const [contentType] = availableEntities.filter((group: GroupedEntities) => group.contentType.label === value)
                  if (contentType) {
                    setSelectedContentType(contentType)
                    setSelectedEntity(null)
                  }
                }}
                disabled={availableEntities && availableEntities.length === 0}
              >
                {availableEntities &&
                  availableEntities.map((group: GroupedEntities, index: number) =>
                    <SingleSelectOption key={index} value={group.contentType.label}>{group.contentType.label}</SingleSelectOption>)
                }
              </SingleSelect>
            </Field.Root>
          </Box>
        </Grid.Item>
        <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.internalItem.entity.label'),
                  defaultMessage: 'Entity'
                })}
              </Field.Label>
              <SingleSelect
                value={selectedEntity ? selectedEntity.id : ''}
                placeholder={formatMessage({
                  id: getTranslation('modal.internalItem.entity.placeholder'),
                  defaultMessage: 'Select an entity'
                })}
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
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
      {selectedEntity && selectedContentType &&
        <>
          <Box paddingBottom={6} paddingTop={6}>
            <Divider/>
          </Box>
          <ItemDetails />
        </>
      }
    </NavModal>
  );
}

export const ItemCreate = withModalSharedLogic<ModalItem_VariantCreate>(ItemCreateComponent);