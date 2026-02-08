import { SingleSelect, SingleSelectOption, Box, Divider, Grid, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import type { Entity, GroupedEntities, ModalItem_VariantCreate, Route } from '../../../../../types';
import PathInfo from '../../PathInfo';
import { useEffect, useState } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';
import { NavModal } from '../'
import { useIntl } from 'react-intl';
import { getTranslation, createTempNavItemObject } from '../../../utils';
import { FullLoader } from '../../UI';
import { useApi } from '../../../hooks';

// TODO: Let the user select if the parent slug should be inherited or not
// TODO: Add hint if a route is added that already exists in a navigation (because there is only one path per route)

type ItemDetailsProps = Pick<ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>, 'navItemState' | 'dispatchItemState' | 'path' | 'dispatchPath' | 'validationState' >;

function ItemDetails({ navItemState, dispatchItemState, path, dispatchPath, validationState }: ItemDetailsProps) {
  const { formatMessage } = useIntl();
  
  return (
    <>
      <Grid.Root gap={4}>
        <Grid.Item col={6} s={12} alignItems="baseline">
          <Box width="100%">
            <Field.Root required>
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
                value={navItemState?.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchItemState({ type: 'SET_TITLE', payload: e.target.value })}
                required
              />
            </Field.Root>
          </Box>
        </Grid.Item>
        <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root required>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.item.pathField.label'),
                  defaultMessage: 'Path'
                })}
              </Field.Label>
              <Field.Input
                placeholder={formatMessage({
                  id: getTranslation('modal.item.pathField.placeholder'),
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
            <PathInfo validationState={validationState} replacement={path.replacement} />
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

function ItemCreateComponent({ 
  availableEntities,
  selectedContentType,
  setSelectedContentType,
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
  const [route, setRoute] = useState<Route | null>(null);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(false)
  const [loadingRoute, setLoadingRoute] = useState(true)
  const { formatMessage } = useIntl();
  const { getRelatedRoute } = useApi();

  useEffect(() => {
    if (path.needsUrlCheck && path.value) {
      if (path.uidPath === path.value || path.initialPath === path.value) return
			debouncedCheckUrl(path.value, route?.documentId);
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck, route?.documentId]);

  useEffect(() => {
    async function fetchRoute() {
      if (!selectedContentType?.contentType || !entity?.documentId) return setLoadingRoute(false)
      
      setLoadingRoute(true)
      try {
        const relatedRoute = await getRelatedRoute(entity.documentId)

        // TODO: Create a route if not existing or show error
        if (!relatedRoute) throw new Error('No route found for the selected entity')

        dispatchPath({ type: 'NO_URL_CHECK', payload: relatedRoute.path });
        dispatchPath({ type: 'SET_UIDPATH', payload: relatedRoute.uidPath });
        dispatchPath({ type: 'SET_INITIALPATH', payload: relatedRoute.path });

        dispatchItemState({ type: 'SET_TITLE', payload: relatedRoute.title })
        dispatchItemState({ type: 'SET_ACTIVE', payload: relatedRoute.active })
        dispatchItemState({ type: 'SET_OVERRIDE', payload: relatedRoute.isOverride })
        
        initialState.current = {
          title: relatedRoute.title,
          slug: relatedRoute.path,
          active: relatedRoute.active,
          isOverride: relatedRoute.isOverride,
        }

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

      if (!selectedContentType?.contentType || !entity?.documentId || !path || !path.value?.trim() || !navItemState.title || !navItemState.title?.trim() || !selectedNavigation || !route) return

      // TODO: Handle route update if path changed
      // if (path.value !== path.initialPath) {
      //   if (navItemState.slug !== route.path) navItemState.isOverride = true
      //   await updateRoute({path: path.value}, route.documentId)
      //   settings.routeUpdate = { path: path.value }
      // }

      const newItem = createTempNavItemObject({
        parentId,
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
      disabled={!selectedContentType?.contentType || !entity?.documentId || !path || !path.value?.trim() || !navItemState.title || !navItemState.title?.trim()}
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
          {loadingRoute ? 
            <FullLoader height={50}/>
           :
            <ItemDetails
              navItemState={navItemState}
              dispatchItemState={dispatchItemState}
              path={path}
              dispatchPath={dispatchPath}
              validationState={validationState}
            />
          }
        </>
      }
    </NavModal>
  );
}

export const ItemCreate = withModalSharedLogic<ModalItem_VariantCreate>(ItemCreateComponent);