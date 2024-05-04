import { ModalContext } from '../../contexts';
import { useContext } from 'react';
import { Dialog, DialogBody, DialogFooter, Flex, Typography, Button } from '@strapi/design-system';
import { ExclamationMarkCircle, Trash } from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';
import { NavItem } from '../../types';

type NavDeleteProps = {
  item: NavItem;
  fetchNavigations: () => void;
}


export default function NavDelete ({ item, fetchNavigations }: NavDeleteProps) {
  const { del } = useFetchClient();

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};  

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }
  
  const handleDelete = async () => {
    await del(`/url-routes/navigation/${item.id}`)
    fetchNavigations()
    setOpenModal('overview')
  }

  return (
    <>
      <Dialog onClose={() => setOpenModal('overview')} title={`Delete ${item.name}?`} isOpen={true}>
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Flex direction="column" alignItems="center" gap={2}>
            <Flex justifyContent="center">
            <Typography textAlign="center">Are you sure you want to delete the navigation "{<span style={{fontWeight: "bold"}}>{item.name}</span>}"? This can not be undone.</Typography>
            </Flex>
          </Flex>
        </DialogBody>
        <DialogFooter
          startAction={
          <Button onClick={() => setOpenModal('overview')} variant="tertiary">
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