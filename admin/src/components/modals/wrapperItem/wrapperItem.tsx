import { ModalLayout, ModalBody, ModalFooter, Button, TextInput, Grid, GridItem, Box, Divider, ToggleInput } from '@strapi/design-system';
import ModalHeader from '../ModalHeader';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NavItemSettings, NestedNavItem } from '../../../../../types';
import { useModalSharedLogic } from '../useModalSharedLogic';
import React, { useEffect } from 'react';

type externalItemProps = {
  variant: 'WrapperCreate' | 'WrapperEdit';
  item?: NestedNavItem;
  parentId?: number;
}

function WrapperItemComponent({ 
  variant,
  item,
  createNavItem,
  navItemState,
  dispatchItemState,
  createExternalRoute,
  updateRoute,
  dispatchPath,
  setModal,
  selectedNavigation,
  parentId,
}: externalItemProps & ReturnType<typeof useModalSharedLogic>) {
  
  useEffect(() => {
    if (variant !== 'WrapperEdit' || !item) return

    dispatchItemState({ type: 'SET_TITLE', payload: item.route.title })
    dispatchItemState({ type: 'SET_ACTIVE', payload: item.route.active })
    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: item.route.fullPath })
  }, [])

  const addItem = async () => {
    try {

      if (!navItemState.title || !selectedNavigation) return

      const data = {
        title: navItemState.title,
        active: navItemState.active,
        internal: false,
        wrapper: true,
      }

      if (variant === 'WrapperEdit' && item) {
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

      setModal('')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <ModalLayout onClose={() => setModal('')}>
      <ModalHeader title={variant === 'WrapperCreate' ? 'Create new wrapper item' : `Edit external route "${navItemState.title}"`}/>
      <ModalBody>
        <Grid gap={8}>
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
        </Grid>
        <Box paddingBottom={6} paddingTop={6}>
          <Divider/>
        </Box>
        <Grid gap={8} paddingBottom={6} >
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
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setModal('')} variant="tertiary">Cancel</Button>}
        endActions={
          <>
            <Button variant="secondary" onClick={() => setModal('ItemCreate')}>Add internal link</Button>
            <Button variant="secondary" onClick={() => setModal('ExternalCreate')}>Add external item</Button>
            <Button disabled={!navItemState.title} onClick={() => addItem()}>{variant === 'WrapperCreate' ? 'Add item' : 'Save'}</Button>
          </>
        }
      />
    </ModalLayout>
  );
}

export const WrapperItem = withModalSharedLogic<externalItemProps>(WrapperItemComponent);
