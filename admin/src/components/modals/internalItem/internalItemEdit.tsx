import { Box, Divider, Grid, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { GroupedEntities, ModalItem_VariantEdit } from '../../../../../types';
import URLInfo from '../../URLInfo';
import { useEffect, useMemo } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';
import { NavModal } from '../'
import { isEqual } from 'lodash';
import { debounce } from '../../../utils';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../utils';

function ItemEditComponent({
  item,
  selectedContentType,
  setSelectedContentType,
  entities,
  replacement,
  validationState,
  initialState,
  navItemState,
  dispatchItemState,
  path,
  dispatchPath,
  debouncedCheckUrl,
  setModalType,
  onEdit,
}: ModalItem_VariantEdit & ReturnType<typeof useModalSharedLogic>) {

  const { formatMessage } = useIntl();

  useEffect(() => {
    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: item.route.path })
    dispatchItemState({ type: 'SET_TITLE', payload: item.route.title })
    dispatchItemState({ type: 'SET_SLUG', payload: item.route.slug })
    dispatchItemState({ type: 'SET_ACTIVE', payload: item.route.active })
    
  const initialValues = {
    title: item.route.title,
    active: item.route.active,
    isOverride: item.route.isOverride,
    slug: item.route.slug,
  };
  
  initialState.current = initialValues;
  
  dispatchPath({ type: 'SET_INITIALPATH', payload: item.route.path });
  }, [])

  useEffect(() => {
    if (!entities) return

    const contentType = entities.find((group: GroupedEntities) => group.contentType.uid === item.route.relatedContentType)
    if (contentType) setSelectedContentType(contentType)
  }, [entities])

  useEffect(() => {
    if (path.needsUrlCheck && path.value) {
      if (path.uidPath === path.value || path.initialPath === path.value) return
      debouncedCheckUrl(path.value, item.route.documentId);
      dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck, item.route.documentId]);

    const debouncedValueEffect = useMemo(() => debounce((path: any) => {
      dispatchPath({ type: 'DEFAULT', payload: path });
    }, 500),
    []
  );

  const handlePathChange = (newPath: string) => {
    if (newPath === path.prevValue) return

    dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: newPath });

    if (newPath === '') return

    debouncedValueEffect(newPath)
  }


  const updateItem = async () => {
    try {
      if (isEqual(navItemState, initialState.current) && path.value === path.initialPath) return
      
      const isOverride = path.value !== item.route.path ? true : navItemState.isOverride

      onEdit({
        ...item,
        update: {
          title: navItemState.title,
          slug: navItemState.slug,
          path: path.value,
          isOverride,
        },
    });
      setModalType('')
    } catch (err) {
      console.log(err)
    }
  }

  if (!selectedContentType) return null

  return (
    <NavModal
      confirmText={formatMessage({ id: getTranslation('save'), defaultMessage: 'Save' })}
      closeText={formatMessage({ id: getTranslation('cancel'), defaultMessage: 'Cancel' })}
      titleText={`${formatMessage({ id: getTranslation('edit'), defaultMessage: 'Edit' })} ${selectedContentType.contentType.label} "${item.route.title}"`}
      loadingText={formatMessage({ id: getTranslation('modal.internalItem.loadingText.edit'), defaultMessage: 'Saving' })}
      onConfirm={updateItem}
      modalToOpen=''
      currentModalType="ItemCreate"
      currentModalMode="edit"
      disabled={isEqual(navItemState, initialState.current) && path.value === path.initialPath}
    >
      <Grid.Root gap={8}>
        <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.internalItem.contentType.label'),
                  defaultMessage: 'Content Type'
                })}
              </Field.Label>
              <Field.Input
                value={selectedContentType.contentType.label}
                disabled
              />
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
              <Field.Input
                value={`${item.route.relatedId} - ${item.route.title}`}
                disabled
              />
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
      <Box paddingBottom={6} paddingTop={6}>
        <Divider/>
      </Box>
      <Box>
        <Grid.Root gap={8}>
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
                  placeholder={formatMessage({
                    id: getTranslation('modal.item.routeField.placeholder'),
                    defaultMessage: 'e.g. about/'
                  })}
                  value={path.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePathChange(e.target.value)}
                  onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value === path.prevValue) return
                    dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
                  }
                  required
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
              <Toggle
                label="Is visible?"
                onLabel="Yes"
                offLabel="No"
                hint='This menu item does not show on your site, if set to "no".'
                checked={navItemState.active}
                onClick={() => dispatchItemState({ type: 'SET_ACTIVE', payload: !navItemState.active })}
              />
            </Box>
          </Grid.Item>
        </Grid.Root> */}
      </Box>
    </NavModal>)
}
export const ItemEdit = withModalSharedLogic<ModalItem_VariantEdit>(ItemEditComponent);