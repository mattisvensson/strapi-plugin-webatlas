import { Modal, Button, TextInput, Grid, Box, Divider, Toggle } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NavItemSettings, NestedNavItem } from '../../../../../types';
import { useModalSharedLogic } from '../useModalSharedLogic';
import React, { useEffect } from 'react';

type externalItemProps = {
  variant: 'ExternalCreate' | 'ExternalEdit';
  item?: NestedNavItem;
  parentId?: number;
}

function ExternalItemComponent({ 
  variant,
  item,
  createNavItem,
  navItemState,
  dispatchItemState,
  createExternalRoute,
  updateRoute,
  path,
  dispatchPath,
  setModalType,
  selectedNavigation,
  parentId,
}: externalItemProps & ReturnType<typeof useModalSharedLogic>) {
  
  useEffect(() => {
    if (variant !== 'ExternalEdit' || !item) return

    dispatchItemState({ type: 'SET_TITLE', payload: item.route.title })
    dispatchItemState({ type: 'SET_ACTIVE', payload: item.route.active })
    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: item.route.fullPath })
  }, [])

  const addItem = async () => {
    try {

      if (!path || !navItemState.title || !selectedNavigation) return

      const data = {
        title: navItemState.title,
        fullPath: path.value,
        active: navItemState.active,
        internal: false,
      }

      if (variant === 'ExternalEdit' && item) {
        await updateRoute(data, item.route.id)
      } else {
        const route = await createExternalRoute(data)
  
        if (!route) return
  
        const settings: NavItemSettings = {
          route: route.id,
          parent: parentId ?? null,
          navigation: selectedNavigation.id,
        }
  
        await createNavItem(settings);
      }

      setModalType('')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Modal.Root onClose={() => setModalType('')}>
      <Modal.Header title={variant ===  'ExternalCreate' ? 'Create new external item' : `Edit external route "${navItemState.title}"`}/>
      <Modal.Body>
        <Grid gap={8}>
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
              placeholder="https://example.com"
              label="Path"
              name="slug"
              value={path.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
  
            />
          </Grid.Item>
        </Grid>
        <Box paddingBottom={6} paddingTop={6}>
          <Divider/>
        </Box>
        <Grid gap={8} paddingBottom={6} >
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
      </Modal.Body>
      <Modal.Footer
        startActions={<Button onClick={() => setModalType('')} variant="tertiary">Cancel</Button>}
        endActions={
          <>
            <Button variant="secondary" onClick={() => setModalType('ItemCreate')}>Add internal link</Button>
            <Button variant="secondary" onClick={() => setModalType('WrapperCreate')}>Add wrapper component</Button>
            <Button disabled={!navItemState.title || !path} onClick={() => addItem()}>{variant === 'ExternalCreate' ? 'Add item' : 'Save'}</Button>
          </>
        }
      />
    </Modal.Root>
  );
}

export const ExternalItem = withModalSharedLogic<externalItemProps>(ExternalItemComponent);