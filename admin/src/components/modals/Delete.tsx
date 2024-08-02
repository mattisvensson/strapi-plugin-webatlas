import { ModalContext } from '../../contexts';
import { useContext, useRef } from 'react';
import { Dialog, DialogBody, DialogFooter, Flex, Typography, Button } from '@strapi/design-system';
import { ExclamationMarkCircle, Trash } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';
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

export default function Delete ({ variant, item, fetchNavigations }: DeleteProps) {
  const { del } = useFetchClient();

  const itemName = useRef(variant === "NavDelete" ? item.name : item.route.title)
  const closeModalState = useRef(variant === "NavDelete" ? 'overview' : '')

  const { setModal } = useContext(ModalContext);

  const handleDelete = async () => {
    try {
        await del(`/url-routes/${variant === "NavDelete" ? 'navigation' : 'navitem'}/${item.id}`)
    } catch (err) {
      console.log(err)
    }

    fetchNavigations()
    setModal(closeModalState.current)
  }

  return (
    <>
      <Dialog onClose={() => setModal(closeModalState.current)} title={`Delete ${itemName.current}?`} isOpen={true}>
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Flex direction="column" alignItems="center" gap={2}>
            <Flex justifyContent="center">
            <Typography textAlign="center">Are you sure you want to delete the navigation {variant === "ItemDelete" &&  "item"} "{<span style={{fontWeight: "bold"}}>{itemName.current}</span>}"? This can not be undone.</Typography>
            </Flex>
          </Flex>
        </DialogBody>
        <DialogFooter
          startAction={
            <Button onClick={() => setModal(closeModalState.current)} variant="tertiary">
              No, keep
            </Button>
          }
          endAction={
            <Button variant="danger-light" onClick={() => handleDelete()} startIcon={<Trash />}>
              Yes, delete
            </Button>
          }
        />
    </Dialog>
    </>
  )
}
