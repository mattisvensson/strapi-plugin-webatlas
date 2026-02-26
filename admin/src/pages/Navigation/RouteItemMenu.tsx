import type { NestedNavItem } from '../../../../types';
import { Typography, SimpleMenu, MenuItem, IconButton } from '@strapi/design-system';
import { More } from '@strapi/icons';
import { getTranslation } from '../../utils';
import { Link as RouterLink } from 'react-router-dom';
import { useIntl } from 'react-intl';

export default function RouteItemMenu({
  item,
  depth,
  maxDepth,
  handleEdit,
  handleAddChildren,
  handleDelete,
  handleRestore
}: {
  item: NestedNavItem;
  depth?: number;
  maxDepth: number;
  handleEdit: () => void;
  handleAddChildren: () => void;
  handleDelete: () => void;
  handleRestore: () => void;
}) {
  const { formatMessage } = useIntl();

  const viewEntityTo = item.route.relatedContentType && item.route.relatedDocumentId
    ? `/content-manager/collection-types/${item.route.relatedContentType}/${item.route.relatedDocumentId}`
    : null;

  return (
    <SimpleMenu label="Item actions" tag={IconButton} icon={<More />}>
      {!item.deleted && <>
        <MenuItem onClick={() => handleEdit()}>
          {formatMessage({
            id: getTranslation('edit'),
            defaultMessage: 'Edit',
          })}
        </MenuItem>
        {item.route.type === 'internal' && viewEntityTo && <MenuItem
          isLink
          as={RouterLink}
          to={viewEntityTo}
        >
          <Typography>
            {formatMessage({
              id: getTranslation('navigation.page.navItem.viewEntity'),
              defaultMessage: 'View Entity',
            })}
          </Typography>
        </MenuItem>}
        {depth !== undefined && depth < maxDepth && <MenuItem onClick={() => handleAddChildren()}>
          {formatMessage({
            id: getTranslation('navigation.page.navItem.addChildren'),
            defaultMessage: 'Add children',
          })}
        </MenuItem>}
        <MenuItem onClick={() => handleDelete()}>
          <Typography textColor="danger600">
            {formatMessage({
              id: getTranslation('delete'),
              defaultMessage: 'Delete',
            })}
          </Typography>
        </MenuItem>
      </>}
      {(item.deleted || item.update) && <>
        <MenuItem onClick={() => handleRestore()}>
          {formatMessage({
            id: getTranslation('restore'),
            defaultMessage: 'Restore',
          })}
        </MenuItem>
      </>}
      </SimpleMenu>
  )
}
