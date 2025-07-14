import { ModalContext } from '../../contexts';
import { useContext, useRef } from 'react';
import { Dialog, Typography, Button } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { NestedNavigation, NestedNavItem } from '../../../../types';

type NavDelete = {
  variant: "NavDelete";
  item: NestedNavigation;
  fetchNavigations: () => void;
}

type ItemDelete = {
  variant: "ItemDelete";
  item: NestedNavItem;
  fetchNavigations: () => void;
}

type DeleteProps = NavDelete | ItemDelete;

export default function Delete({ variant, item, fetchNavigations }: DeleteProps) {
  const { del } = useFetchClient();

  const itemName = useRef(variant === "NavDelete" ? item.name : item.route.title)
  const closeModalState = useRef(variant === "NavDelete" ? 'NavOverview' : '')

  const { setModalType } = useContext(ModalContext);

  const handleDelete = async () => {
    try {
      await del(`/webatlas/${variant === "NavDelete" ? 'navigation' : 'navitem'}/${item.id}`)
    } catch (err) {
      console.log(err)
    }

    fetchNavigations()
    setModalType(closeModalState.current)
  }

  return (
    <>
      <Dialog.Root defaultOpen={true} onClose={() => setModalType(closeModalState.current)}>
        <Dialog.Content>
          <Dialog.Header>
            Delete "{itemName.current}"?
          </Dialog.Header>
          <Dialog.Body>
            <Typography textAlign="center">
              Are you sure you want to delete the navigation {variant === "ItemDelete" && "item"} "{<span style={{ fontWeight: "bold" }}>{itemName.current}</span>}"? This can not be undone.
            </Typography>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button onClick={() => setModalType(closeModalState.current)} variant="tertiary">
                No, keep
              </Button>
            </Dialog.Cancel>
            <Dialog.Action>
              <Button variant="danger-light" onClick={() => handleDelete()} startIcon={<Trash />}>
                Yes, delete
              </Button>
            </Dialog.Action>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}