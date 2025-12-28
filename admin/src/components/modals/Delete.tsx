import { ModalContext } from '../../contexts';
import { useContext, useRef } from 'react';
import { Dialog, Typography, Button } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { NestedNavigation, NestedNavItem } from '../../../../types';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';
import { useApi } from '../../hooks';
import { useNavigate } from 'react-router-dom';

type NavDelete = {
  variant: "NavDelete";
  item: NestedNavigation;
  onDelete: (editedItem: NestedNavigation) => void;
}

type ItemDelete = {
  variant: "ItemDelete";
  item: NestedNavItem;
  onDelete: (editedItem: NestedNavItem) => void;
}

type DeleteProps = NavDelete | ItemDelete;

export default function Delete({ variant, item, onDelete }: DeleteProps) {
  
  const itemName = useRef(variant === "NavDelete" ? item.name : item.route.title)
  const closeModalState = useRef(variant === "NavDelete" ? 'NavOverview' : '')
  
  const { setModalType } = useContext(ModalContext);
  const { formatMessage } = useIntl();
  const { deleteNavigation } = useApi();
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      if (variant === "NavDelete") {
        await deleteNavigation(item.documentId);
        onDelete(item);
      } else if (variant === "ItemDelete") {
        const editedItem = { ...item, deleted: true };
        onDelete(editedItem);
      }
    } catch (err) {
      console.log(err)
    }

    setModalType(closeModalState.current)
  }

  return (
    <Dialog.Root defaultOpen={true} onClose={() => setModalType(closeModalState.current)}>
      <Dialog.Content>
        <Dialog.Header>
          {formatMessage({
            id: getTranslation('delete'),
            defaultMessage: 'Delete'
          })}
          : "{itemName.current}"?
        </Dialog.Header>
        <Dialog.Body>
          <Typography textAlign="center">
            {formatMessage({
              id: getTranslation('modal.delete.message.start'),
              defaultMessage: 'You are about to delete the following'
            })}
            {" "}
            {variant === "ItemDelete" ?
              formatMessage({
                id: getTranslation('modal.delete.message.navItem'),
                defaultMessage: 'navigation item'
              }) : 
              formatMessage({
                id: getTranslation('modal.delete.message.navigation'),
                defaultMessage: 'navigation'
              })
            }
          </Typography>
          <Typography textAlign="center" fontWeight="bold" style={{ marginTop: 8, marginBottom: 8, fontSize: 20 }}>
            {itemName.current}
          </Typography>
          <Typography textAlign="center">
            {formatMessage({
              id: getTranslation('modal.delete.message.end'),
              defaultMessage: 'This can not be undone. Are you sure?'
            })}
          </Typography>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Cancel>
            <Button onClick={() => setModalType(closeModalState.current)} variant="tertiary">
              {formatMessage({
                id: getTranslation('modal.delete.cancelText'),
                defaultMessage: 'No, keep'
              })}
            </Button>
          </Dialog.Cancel>
          <Dialog.Action>
            <Button variant="danger-light" onClick={() => handleDelete()} startIcon={<Trash />}>
              {formatMessage({
                id: getTranslation('modal.delete.confirmText'),
                defaultMessage: 'Yes, delete'
              })}
            </Button>
          </Dialog.Action>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}