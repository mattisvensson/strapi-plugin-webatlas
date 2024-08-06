import { ModalLayout, ModalBody, ModalFooter, Button, TextInput, ToggleInput, Box, Divider, Grid, GridItem } from '@strapi/design-system';
import ModalHeader from '../ModalHeader';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { GroupedEntities, ModalItem_VariantEdit } from '../../../../../types';
import URLInfo from '../../URLInfo';
import { useEffect } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';

function ItemEditComponent({
  item,
  selectedContentType,
  setSelectedContentType,
  entities,
  updateRoute,
  replacement,
  validationState,
  initialState,
  navItemState,
  dispatchItemState,
  path,
  dispatchPath,
  debouncedCheckUrl,
  setModal,
}: ModalItem_VariantEdit & ReturnType<typeof useModalSharedLogic>) {

  useEffect(() => {
    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: item.route.fullPath })
    dispatchItemState({ type: 'SET_TITLE', payload: item.route.title })
    dispatchItemState({ type: 'SET_ACTIVE', payload: item.route.active })
  }, [])

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

  const updateItem = async () => {
    try {
      if (JSON.stringify(navItemState) === JSON.stringify(initialState.current) && path.value === path.initialPath) return
      
      if (navItemState.slug !== item.route.fullPath) dispatchItemState({ type: 'SET_OVERRIDE', payload: true })
      
      await updateRoute({
        ...navItemState,
        slug: path.value
      }, item.route.id)

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
              value={navItemState.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchItemState({ type: 'SET_TITLE', payload: e.target.value })}
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
              onClick={() => dispatchItemState({ type: 'SET_ACTIVE', payload: !navItemState.active })}
            />
          </GridItem>
        </Grid>
      </Box>
    </ModalBody>
    <ModalFooter
      startActions={<Button onClick={() => setModal('')} variant="tertiary">Cancel</Button>}
      endActions={<Button onClick={() => updateItem()} disabled={JSON.stringify(navItemState) === JSON.stringify(initialState.current) && path.value === path.initialPath}>Save</Button>}
    />
  </ModalLayout>  )
}
export const ItemEdit = withModalSharedLogic<ModalItem_VariantEdit>(ItemEditComponent);