import type { GroupedEntities } from '../../../../../types';
import type { ModalItem_VariantEdit } from '../../../types';
import { Box, Divider, Grid, Field } from '@strapi/design-system';
import { withModalSharedLogic } from '../withModalSharedLogic';
import { useEffect, useMemo } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';
import { NavModal } from '../'
import { isEqual } from 'lodash';
import { useIntl } from 'react-intl';
import { getTranslation, findParentNavItem } from '../../../utils';
import ItemDetails from './ItemDetails';

function ItemEditComponent({
  item,
  selectedContentType,
  setSelectedContentType,
  entities,
  validationState,
  initialState,
  navItemState,
  dispatchNavItemState,
  path,
  dispatchPath,
  debouncedCheckUrl,
  setModalType,
  navigationItems,
  onEdit,
}: ModalItem_VariantEdit & ReturnType<typeof useModalSharedLogic>) {
  const { formatMessage } = useIntl();

  const parentNavItem = useMemo(() => {
    return findParentNavItem({navigationItems: navigationItems, targetItem: item});
  }, [navigationItems, item])

  useEffect(() => {
    const parentPath = parentNavItem?.update?.path || parentNavItem?.route.path || ''
    const initialPath = `${parentPath}/${item.route.slug}`

    dispatchPath({ type: 'DEFAULT', payload: initialPath });
    dispatchPath({ type: 'SET_SLUG', payload: item.route.slug });
    dispatchPath({ type: 'SET_INITIALPATH', payload: initialPath });
    dispatchPath({ type: 'SET_CANONICALPATH', payload: item.route.canonicalPath });

    dispatchNavItemState({ type: 'SET_TITLE', payload: item.route.title })
    dispatchNavItemState({ type: 'SET_ACTIVE', payload: item.route.active })
    dispatchNavItemState({ type: 'SET_OVERRIDE', payload: item.route.isOverride })

    const initialValues = {
      title: item.route.title,
      active: item.route.active,
      isOverride: item.route.isOverride,
      slug: item.route.slug,
    };

    initialState.current = initialValues;
  }, [navigationItems, item, parentNavItem])

  useEffect(() => {
    if (!entities) return

    const contentType = entities.find((group: GroupedEntities) => group.contentType.uid === item.route.relatedContentType)
    if (contentType) setSelectedContentType(contentType)
  }, [entities])

  useEffect(() => {
    if (path.needsUrlCheck && path.value) {
      if (path.uidPath === path.value || path.initialPath === path.value) return
      debouncedCheckUrl({url: path.value, routeDocumentId: item.route.documentId});
      dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck, item.route.documentId]);

  const updateItem = async () => {
    try {
      if (isEqual(navItemState, initialState.current) && path.value === path.initialPath) return

      const isOverride = path.value !== item.route.path ? true : navItemState.isOverride

      onEdit({
        ...item,
        update: {
          title: navItemState.title,
          slug: path.slug,
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
      {item &&
        <>
          <Box paddingBottom={6} paddingTop={6}>
            <Divider/>
          </Box>
          <ItemDetails
            navItemState={navItemState}
            dispatchNavItemState={dispatchNavItemState}
            path={path}
            dispatchPath={dispatchPath}
            validationState={validationState}
            parentNavItem={parentNavItem}
            navigationItems={navigationItems}
            debouncedCheckUrl={debouncedCheckUrl}
            item={item}
            route={item.route}
            modalVariant='edit'
          />
        </>
      }
    </NavModal>)
}
export const ItemEdit = withModalSharedLogic<ModalItem_VariantEdit>(ItemEditComponent);
