import { ModalContext } from '../../contexts';
import { useContext, useEffect, useRef } from 'react';
import { Dialog, DialogBody, DialogFooter, Flex, Typography, Button } from '@strapi/design-system';
import { ExclamationMarkCircle, Trash } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';
import { NavItem, Route } from '../../types';
import isNavItem from '../../utils/isNavItem';

type NavDeleteProps = {
  variant: "NavDelete" | "ItemDelete";
  item: NavItem | Route;
  fetchNavigations: () => void;
}

export default function Delete ({ variant, item, fetchNavigations }: NavDeleteProps) {
  const { del } = useFetchClient();

  const itemName = useRef(isNavItem(item) ? item.name : item.title)
  const closeModalState = useRef(isNavItem(item) ? 'overview' : '')

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }

  const handleDelete = async () => {
    try {
        await del(`/url-routes/${variant === "NavDelete" ? 'navigation' : 'route'}/${item.id}`)
    } catch (err) {
      console.log(err)
    }

    fetchNavigations()
    setOpenModal(closeModalState.current)
  }

  useEffect(() => {
  }, [])

  return (
    <>
      <Dialog onClose={() => setOpenModal(closeModalState.current)} title={`Delete ${itemName.current}?`} isOpen={true}>
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Flex direction="column" alignItems="center" gap={2}>
            <Flex justifyContent="center">
            <Typography textAlign="center">Are you sure you want to delete the navigation {variant === "ItemDelete" &&  "item"} "{<span style={{fontWeight: "bold"}}>{itemName.current}</span>}"? This can not be undone.</Typography>
            </Flex>
          </Flex>
        </DialogBody>
        <DialogFooter
          startAction={
          <Button onClick={() => setOpenModal(closeModalState.current)} variant="tertiary">
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
