import { Grid, Box, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { NestedNavItem } from '../../../../../types';
import { useModalSharedLogic } from '../useModalSharedLogic';
import React, { useEffect } from 'react';
import { NavModal } from '../'
import { useIntl } from 'react-intl';
import { getTranslation, createTempNavItemObject } from '../../../utils';

type externalCreateProps = {
  variant: 'ExternalCreate';
  parentId?: string;
  onCreate: (newItem: NestedNavItem) => void;
}

type externalEditProps = {
  variant: 'ExternalEdit';
  item: NestedNavItem;
  onSave: (editedItem: NestedNavItem) => void;
}

type externalItemProps = externalCreateProps | externalEditProps;

function isExternalEditProps(
  props: externalItemProps
): props is externalEditProps {
  return props.variant === 'ExternalEdit';
}
function isExternalCreateProps(
  props: externalItemProps
): props is externalCreateProps {
  return props.variant === 'ExternalCreate';
}

function ExternalItemComponent(props: externalItemProps & ReturnType<typeof useModalSharedLogic>) {
  const {
    variant,
    navItemState,
    dispatchItemState,
    path,
    dispatchPath,
    setModalType,
    selectedNavigation,
  } = props;

  const parentId = isExternalCreateProps(props) ? props.parentId : undefined;
  const onCreate = isExternalCreateProps(props) ? props.onCreate : undefined;
  const onSave = isExternalEditProps(props) ? props.onSave : undefined;
  const item = isExternalEditProps(props) ? props.item : undefined;

  const { formatMessage } = useIntl();
  
  useEffect(() => {
    if (variant !== 'ExternalEdit' || !item) return;

    dispatchItemState({ type: 'SET_TITLE', payload: item.route.title });
    dispatchItemState({ type: 'SET_ACTIVE', payload: item.route.active });
    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: item.route.fullPath });
  }, [variant, item, dispatchItemState, dispatchPath]);

  const handleConfirm = async () => {
    try {
      if (!path || !navItemState.title || !selectedNavigation) return

      if (variant === 'ExternalEdit' && item && onSave) {
        onSave({
          ...item,
          update: {
            title: navItemState.title,
            fullPath: path.value,
            // internal: false,
            // active: navItemState.active,
          }
        });
      } else if (onCreate) {
        const newItem = createTempNavItemObject({
          parentId,
          entityRoute: null,
          selectedNavigation,
          navItemState,
          selectedEntity: null,
          selectedContentType: null,
          path,
          internal: false,
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
      onConfirm={handleConfirm}
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