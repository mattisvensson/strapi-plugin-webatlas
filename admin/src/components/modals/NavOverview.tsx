import { Flex, Box, Typography, Divider, Button, ModalLayout, ModalBody, ModalFooter } from '@strapi/design-system';
import { Check, Pencil, Trash } from '@strapi/icons';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { useContext } from 'react';
import { NavItem, Route } from '../../types';
import ModalHeader from './ModalHeader';

type NavOverviewProps = {
  navigations: NavItem[],
  setActionItem: React.Dispatch<React.SetStateAction<NavItem | Route | undefined>>
}

export default function NavOverview ({ navigations, setActionItem }: NavOverviewProps) {

  const ModalContextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};
  if (ModalContextValue !== null) {
    [, setOpenModal] = ModalContextValue;
  }

  const SelectedContextValue = useContext(SelectedNavigationContext);
  let setSelectedNavigation = (_: NavItem) => {};
  let selectedNavigation: NavItem | undefined = undefined;
  if (SelectedContextValue !== null) {
    [selectedNavigation, setSelectedNavigation] = SelectedContextValue;
  }

  const handleSelect = (nav: NavItem) => {
    setSelectedNavigation(nav)
    setOpenModal('')
  }

  const handleEdit = (nav: NavItem) => {
    setActionItem(nav)
    setOpenModal('edit')
  }

  const handleDelete = (nav: NavItem) => {
    setActionItem(nav)
    setOpenModal('NavDelete')
  }

  return (
    <ModalLayout onClose={() => setOpenModal('')}>
      <ModalHeader title="Navigation overview"/>
      <ModalBody>
        {navigations.map((nav, index: number) => (
          <>
            <Flex justifyContent="space-between" key={`box-${nav.slug}`}>
              <Typography textColor="neutral800">
                {nav.name}
              </Typography>
              <Flex gap={2}>
                <Button startIcon={<Trash />} variant="danger-light" onClick={() => handleDelete(nav)}>Delete</Button>
                <Button startIcon={<Pencil />} variant="secondary" onClick={() => handleEdit(nav)}>Edit</Button>
                <Button startIcon={<Check />} variant="primary" onClick={() => handleSelect(nav)} disabled={selectedNavigation ? selectedNavigation.slug === nav.slug : false}>Select</Button>
              </Flex>
            </Flex>
            {navigations.length - 1 !== index && <Box
              paddingTop={2}
              paddingBottom={2}
            >
              <Divider />
            </Box>}
          </>
        ))}
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setOpenModal('')} variant="tertiary">Cancel</Button>}
        endActions={<Button onClick={() => setOpenModal('create')}>Create new</Button>}
      />
    </ModalLayout>
  )
}
