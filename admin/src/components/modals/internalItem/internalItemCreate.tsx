import type { Entity, GroupedEntities, Route } from '../../../../../types';
import type { ModalItem_VariantCreate } from '../../../types';
import { SingleSelect, SingleSelectOption, Box, Divider, Grid, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { useEffect, useState } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';
import { NavModal } from '../'
import { useIntl } from 'react-intl';
import { getTranslation, createTempNavItemObject } from '../../../utils';
import { FullLoader } from '../../UI';
import { useApi } from '../../../hooks';
import ItemDetails from './ItemDetails';

function ItemCreateComponent({
  availableEntities,
  selectedContentType,
  setSelectedContentType,
  validationState,
  navItemState,
  dispatchNavItemState,
  path,
  dispatchPath,
  debouncedCheckUrl,
  setModalType,
  selectedNavigation,
  parentNavItem,
  onCreate,
}: ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>) {
  const [route, setRoute] = useState<Route | null>(null);
  const [parentRoute, setParentRoute] = useState<Route | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(false)
  const [loadingRoute, setLoadingRoute] = useState(true)
  const { formatMessage } = useIntl();
  const { getRelatedRoute, getRoute } = useApi();

  useEffect(() => {
    async function fetchParentRoute() {
      if (!parentNavItem?.documentId) return setParentRoute(null)

      try {
        const relatedRoute = await getRoute(parentNavItem.route.documentId)

        if (!relatedRoute) throw new Error('No route found for the selected parent entity')

        setParentRoute(relatedRoute)
      } catch (err) {
        console.log(err)
      }
    }
    fetchParentRoute()
  }, [parentNavItem])

  useEffect(() => {
    async function fetchRoute() {
      if (!selectedContentType?.contentType || !entity?.documentId) return setLoadingRoute(false)

      setLoadingRoute(true)
      try {
        const relatedRoute = await getRelatedRoute(entity.documentId)

        // TODO: Create a route if not existing or show error
        if (!relatedRoute) throw new Error('No route found for the selected entity')

        dispatchPath({ type: 'NO_URL_CHECK', payload: relatedRoute.path });
        dispatchPath({ type: 'SET_SLUG', payload: relatedRoute.slug });
        dispatchPath({ type: 'SET_UIDPATH', payload: relatedRoute.uidPath });
        dispatchPath({ type: 'SET_INITIALPATH', payload: relatedRoute.path });
        dispatchPath({ type: 'SET_CANONICALPATH', payload: relatedRoute.canonicalPath });

        dispatchNavItemState({ type: 'SET_TITLE', payload: relatedRoute.title })
        dispatchNavItemState({ type: 'SET_ACTIVE', payload: relatedRoute.active })
        dispatchNavItemState({ type: 'SET_OVERRIDE', payload: relatedRoute.isOverride })

        setRoute(relatedRoute)
      } catch (err) {
        console.log(err)
      } finally {
        setLoadingRoute(false)
      }
    }
    fetchRoute()
  }, [entity])

  const addItem = async () => {
    try {
      setLoading(true)

      if (
        !selectedContentType?.contentType
        || !entity?.documentId
        || !path
        || !path.value?.trim()
        || !navItemState.title
        || !navItemState.title?.trim()
        || !selectedNavigation
        || !route
      ) return

      const newItem = createTempNavItemObject({
        parentNavItemId: parentNavItem?.documentId,
        entityRoute: route,
        selectedNavigation,
        navItemState,
        selectedEntity: entity,
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

  if ((availableEntities && availableEntities.length === 0)) {
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
      disabled={
        !selectedContentType?.contentType
        || !entity?.documentId
        || !path
        || !path.value?.trim()
        || !path.slug?.trim()
        || !navItemState.title
        || !navItemState.title?.trim()
      }
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
                    setEntity(null)
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
                value={entity ? entity.documentId : ''}
                placeholder={formatMessage({
                  id: getTranslation('modal.internalItem.entity.placeholder'),
                  defaultMessage: 'Select an entity'
                })}
                onChange={(value: string) => {
                  const flatEntities = availableEntities.flatMap((group: GroupedEntities) => group.entities);
                  const route = flatEntities.find((route: Entity) => route.documentId === value);
                  if (route) setEntity(route);
                }}
                disabled={!selectedContentType || (selectedContentType?.entities && selectedContentType?.entities.length === 0)}
              >
                {selectedContentType &&
                  selectedContentType.entities?.map((entity: Entity) =>
                    <SingleSelectOption key={entity.id} value={entity.documentId}>{entity[selectedContentType.contentType.default]}</SingleSelectOption>
                  )
                }
              </SingleSelect>
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
      {entity && selectedContentType &&
        <>
          <Box paddingBottom={6} paddingTop={6}>
            <Divider/>
          </Box>
          {(loadingRoute || !route) ?
            <FullLoader height={50}/>
           :
            <ItemDetails
              navItemState={navItemState}
              dispatchNavItemState={dispatchNavItemState}
              path={path}
              dispatchPath={dispatchPath}
              validationState={validationState}
              route={route}
              parentRoute={parentRoute}
              debouncedCheckUrl={debouncedCheckUrl}
            />
          }
        </>
      }
    </NavModal>
  );
}

export const ItemCreate = withModalSharedLogic<ModalItem_VariantCreate>(ItemCreateComponent);
