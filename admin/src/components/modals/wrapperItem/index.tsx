import { Grid, Box, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NestedNavItem } from '../../../../../types';
import { useModalSharedLogic } from '../useModalSharedLogic';
import React, { useEffect } from 'react';
import { NavModal } from '../';
import { useIntl } from 'react-intl';
import { getTranslation, createTempNavItemObject } from '../../../utils';

type wrapperCreateProps = {
  variant: 'WrapperCreate';
  parentId?: string;
  onCreate: (newItem: NestedNavItem) => void;
}

type wrapperEditProps = {
  variant: 'WrapperEdit';
  item: NestedNavItem;
  onSave: (editedItem: NestedNavItem) => void;
}

type wrapperItemProps = wrapperCreateProps | wrapperEditProps;

function isWrapperEditProps(
  props: wrapperItemProps
): props is wrapperEditProps {
  return props.variant === 'WrapperEdit';
}
function isWrapperCreateProps(
  props: wrapperItemProps
): props is wrapperCreateProps {
  return props.variant === 'WrapperCreate';
}

function WrapperItemComponent(props: wrapperItemProps & ReturnType<typeof useModalSharedLogic>) {
  const {
    variant,
    navItemState,
    dispatchItemState,
    dispatchPath,
    setModalType,
    selectedNavigation,
  } = props;

  const parentId = isWrapperCreateProps(props) ? props.parentId : undefined;
  const onCreate = isWrapperCreateProps(props) ? props.onCreate : undefined;
  const onSave = isWrapperEditProps(props) ? props.onSave : undefined;
  const item = isWrapperEditProps(props) ? props.item : undefined;

  const { formatMessage } = useIntl();
  
  useEffect(() => {
    if (variant !== 'WrapperEdit' || !item) return

    dispatchItemState({ type: 'SET_TITLE', payload: item.route.title })
    dispatchItemState({ type: 'SET_ACTIVE', payload: item.route.active })
    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: item.route.fullPath })
  }, [])

  const onConfirm = async () => {
    try {

      if (!navItemState.title || !selectedNavigation) return

      const data = {
        title: navItemState.title,
        active: navItemState.active,
        internal: false,
        wrapper: true,
      }

      if (variant === 'WrapperEdit' && item && onSave) {
        onSave({
          ...item,
          update: { 
            ...data
          }
        })
      } else if (onCreate) {
        const newItem = createTempNavItemObject({
          parentId,
          entityRoute: null,
          selectedNavigation,
          navItemState,
          selectedEntity: null,
          selectedContentType: null,
          wrapper: true,
        })
        onCreate(newItem);
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
      onConfirm={onConfirm}
      modalToOpen=''
      currentModalType="WrapperCreate"
      currentModalMode={variant === 'WrapperCreate' ? 'create' : 'edit'}
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

export const WrapperItem = withModalSharedLogic<wrapperItemProps>(WrapperItemComponent);