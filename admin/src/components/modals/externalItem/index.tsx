import { TextInput, Grid, Box, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NavItemSettings, NestedNavItem } from '../../../../../types';
import { useModalSharedLogic } from '../useModalSharedLogic';
import React, { useEffect } from 'react';
import { NavModal } from '../'
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../utils';

type externalItemProps = {
  variant: 'ExternalCreate' | 'ExternalEdit';
  item?: NestedNavItem;
  parentDocumentId?: string;
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
  parentDocumentId,
}: externalItemProps & ReturnType<typeof useModalSharedLogic>) {

  const { formatMessage } = useIntl();
  
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
        await updateRoute(data, item.route.documentId)
      } else {
        const route = await createExternalRoute(data)
  
        if (!route) return
  
        const settings: NavItemSettings = {
          route: route.documentId,
          parent: parentDocumentId ?? null,
          navigation: selectedNavigation.documentId,
        }
  
        await createNavItem(settings);
      }

      setModalType('')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <NavModal
      confirmText={variant === 'ExternalCreate' ? 
        formatMessage({ id: getTranslation('add'), defaultMessage: 'Add' }) : 
        formatMessage({ id: getTranslation('save'), defaultMessage: 'Save' })
      }
      closeText={formatMessage({ id: getTranslation('cancel'), defaultMessage: 'Cancel' })}
      titleText={variant ===  'ExternalCreate' ?
        formatMessage({ id: getTranslation('modal.externalItem.titleText.create'), defaultMessage: 'Create new external item' }) : 
        formatMessage({ id: getTranslation('modal.externalItem.titleText.edit'), defaultMessage: `Edit external route "${navItemState.title}"` })
      }
      loadingText={variant === 'ExternalCreate' ? 
        formatMessage({ id: getTranslation('modal.externalItem.loadingText.create'), defaultMessage: 'Adding' }) : 
        formatMessage({ id: getTranslation('modal.externalItem.loadingText.edit'), defaultMessage: 'Saving' })
      }
      onConfirm={addItem}
      modalToOpen=''
      currentModalType="ExternalCreate"
      currentModalMode={variant === 'ExternalCreate' ? 'create' : 'edit'}
    >
      <Grid.Root gap={8}>
        <Grid.Item col={6} s={12}>
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
                  defaultMessage: 'Path'
                })}
              </Field.Label>
              <Field.Input
                required
                placeholder={formatMessage({
                  id: getTranslation('modal.externalItem.routeField.placeholder'),
                  defaultMessage: 'e.g. https://example.com'
                })}
                name="slug"
                value={path?.value || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
              />
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
      {/* TODO: Add visibility toggle to navitem schema */}
      {/* <Box paddingBottom={6} paddingTop={6}>
        <Divider/>
      </Box>
      <Grid.Root gap={8} paddingBottom={6} >
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
      </Grid.Root> */}
    </NavModal>
  );
}

export const ExternalItem = withModalSharedLogic<externalItemProps>(ExternalItemComponent);