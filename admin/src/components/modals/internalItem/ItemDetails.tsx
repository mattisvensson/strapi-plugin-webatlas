import type { Route } from '../../../../../types';
import type { ModalItem_VariantCreate } from '../../../types';
import { Box, Grid, Field, Flex, Badge } from '@strapi/design-system';
import PathInfo from '../../PathInfo';
import { useEffect } from 'react';
import { useModalSharedLogic } from '../useModalSharedLogic';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../utils';
import Tooltip from '../../Tooltip';
import { Typography } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';

type ItemDetailsProps = Pick<ModalItem_VariantCreate & ReturnType<typeof useModalSharedLogic>, 'navItemState' | 'dispatchNavItemState' | 'path' | 'dispatchPath' | 'validationState' | 'debouncedCheckUrl'> &
  { route: Route, parentRoute: Route | null }

export default function ItemDetails({
  navItemState,
  dispatchNavItemState,
  path,
  dispatchPath,
  validationState,
  route,
  parentRoute,
  debouncedCheckUrl
}: ItemDetailsProps) {
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (path.needsUrlCheck && path.value) {
      if (path.uidPath === path.value || path.initialPath === path.value) return
			debouncedCheckUrl({ url: path.value, routeDocumentId: route.documentId, withoutTransform: true });
			dispatchPath({ type: 'RESET_URL_CHECK_FLAG' });
    }
  }, [path.needsUrlCheck, route.documentId]);

  useEffect(() => {
    if (!path.slug) return
    const newPath = parentRoute ? `${parentRoute.canonicalPath}/${path.slug}` : path.slug
    dispatchPath({ type: 'DEFAULT', payload: newPath })
  }, [path.slug, parentRoute])

  return (
    <Grid.Root gap={4}>
      {path.canonicalPath !== path.value && <Grid.Item col={12} s={12} alignItems="baseline">
        <Badge variant="warning" minWidth="100%">
          <Flex alignItems="center" gap={2}>
            <WarningCircle />
            <Typography>
              {formatMessage({
                id: getTranslation('modal.item.canonicalPathMismatch'),
                defaultMessage: 'Warning: Canonical Path does not match navigation path'
              })}
            </Typography>
          </Flex>
        </Badge>
      </Grid.Item>}
      <Grid.Item col={12} s={12} alignItems="baseline">
        <Box width="100%">
          <Field.Root required>
            <Field.Label>
              {formatMessage({
                id: getTranslation('modal.item.titleField.label'),
                defaultMessage: 'Title'
              })}
            </Field.Label>
            <Field.Input
              name="title"
              value={navItemState?.title || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchNavItemState({ type: 'SET_TITLE', payload: e.target.value })}
              required
            />
          </Field.Root>
        </Box>
      </Grid.Item>
      <Grid.Item col={6} s={12} alignItems="baseline">
        <Box width="100%">
          <Field.Root>
            <Field.Label>
              {formatMessage({
                id: getTranslation('modal.item.canonicalPathField.label'),
                defaultMessage: 'Canonical Path'
              })}
              <Tooltip description={formatMessage({
                id: getTranslation('modal.item.canonicalPathField.tooltip'),
                defaultMessage: 'Based on content hierarchy'
              })} />
            </Field.Label>
            <Field.Input
              name="canonicalPath"
              value={route.canonicalPath || ''}
              disabled
            />
            <Field.Hint />
          </Field.Root>
        </Box>
      </Grid.Item>
      <Grid.Item col={6} s={12} alignItems="baseline">
        <Box width="100%">
          <Field.Root required>
            <Field.Label>
              {formatMessage({
                id: getTranslation('modal.item.slugField.label'),
                defaultMessage: 'Slug'
              })}
            </Field.Label>
            <Field.Input
              name="slug"
              value={path.slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'SET_SLUG', payload: e.target.value })}
              onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                dispatchPath({ type: 'SET_SLUG', payload: e.target.value })}
              }
            />
          </Field.Root>
        </Box>
      </Grid.Item>
      <Grid.Item col={6} s={12} alignItems="baseline">
        <Box width="100%">
          <Field.Root>
            <Field.Label>
              {formatMessage({
                id: getTranslation('modal.item.navigationPosition.label'),
                defaultMessage: 'Navigation Position'
              })}
            </Field.Label>
            <Field.Input
              name="navigationPosition"
              value={parentRoute?.title || 'Root'}
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
                id: getTranslation('modal.item.pathField.label'),
                defaultMessage: 'Path'
              })}
            </Field.Label>
            <Field.Input
              name="path"
              value={path.value}
              disabled
            />
          </Field.Root>
          <PathInfo validationState={validationState} replacement={path.replacement} />
        </Box>
      </Grid.Item>
    </Grid.Root>
  )
}
