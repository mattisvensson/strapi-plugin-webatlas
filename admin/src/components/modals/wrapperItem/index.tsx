import { Grid, Box, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NavItemSettings, NestedNavItem } from '../../../../../types';
import { useModalSharedLogic } from '../useModalSharedLogic';
import React, { useEffect } from 'react';
import { NavModal } from '../';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../utils';

type externalItemProps = {
  variant: 'WrapperCreate' | 'WrapperEdit';
  item?: NestedNavItem;
  parentDocumentId?: string;
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
  setModalType,
  selectedNavigation,
  parentDocumentId,
}: externalItemProps & ReturnType<typeof useModalSharedLogic>) {

  const { formatMessage } = useIntl();
  
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
      confirmText={variant === 'WrapperCreate' ? 
        formatMessage({ id: getTranslation('add'), defaultMessage: 'Add' }) : 
        formatMessage({ id: getTranslation('save'), defaultMessage: 'Save' })
      } 
      closeText={formatMessage({ id: getTranslation('cancel'), defaultMessage: 'Cancel' })}
      titleText={variant === 'WrapperCreate' ? 
        formatMessage({ id: getTranslation('modal.wrapperItem.titleText.create'), defaultMessage: 'Create new wrapper item' }) :
        formatMessage({ id: getTranslation('modal.wrapperItem.titleText.edit'), defaultMessage: 'Edit wrapper item:' }) + ` "${navItemState.title}"`
      }
      loadingText={variant === 'WrapperCreate' ? 
        formatMessage({ id: getTranslation('modal.wrapperItem.loadingText.create'), defaultMessage: 'Adding' }) : 
        formatMessage({ id: getTranslation('modal.wrapperItem.loadingText.edit'), defaultMessage: 'Saving' })  
      }
      onConfirm={addItem}
      modalToOpen=''
      currentModalType="WrapperCreate"
    >
      <Grid.Root gap={8}>
        <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.wrapperItem.titleField.label'),
                  defaultMessage: 'Title' 
                })}
              </Field.Label>
              <Field.Input
                placeholder={formatMessage({
                  id: getTranslation('modal.wrapperItem.titleField.placeholder'),
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
      </Grid.Root>
      {/* TODO: Add visibility toggle to navitem schema */}
      {/* <Box paddingBottom={6} paddingTop={6}>
        <Divider/>
      </Box>
      <Grid.Root gap={8} paddingBottom={6} >
        <Grid.Item col={6}>
        <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.activeField.label'),
                  defaultMessage: 'Active'
                })}
              </Field.Label>
              <Toggle
                onLabel={formatMessage({
                  id: getTranslation('modal.activeField.onLabel'),
                  defaultMessage: 'Yes'
                })}
                offLabel={formatMessage({
                  id: getTranslation('modal.activeField.offLabel'),
                  defaultMessage: 'No'
                })}
                checked={navItemState.active}
                onChange={() => dispatchItemState({ type: 'SET_ACTIVE', payload: !navItemState.active })}
              />
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root> */}
    </NavModal>
  );
}

export const WrapperItem = withModalSharedLogic<externalItemProps>(WrapperItemComponent);