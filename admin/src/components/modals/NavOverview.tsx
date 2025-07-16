import { Flex, Box, Typography, Divider, Button } from '@strapi/design-system';
import { Check, Pencil, Trash } from '@strapi/icons';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { useContext } from 'react';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { NavModal } from '../modals';
import Center from '../UI/Center';

type NavOverviewProps = {
  navigations: NestedNavigation[],
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>
}

export default function NavOverview ({ navigations, setActionItem }: NavOverviewProps) {

  const { setModalType } = useContext(ModalContext);
  const { selectedNavigation, setSelectedNavigation } = useContext(SelectedNavigationContext);

  const handleSelect = (nav: NestedNavigation) => {
    setSelectedNavigation(nav)
    setModalType('')
  }

  const handleEdit = (nav: NestedNavigation) => {
    setActionItem(nav)
    setModalType('NavEdit')
  }

  const handleDelete = (nav: NestedNavigation) => {
    setActionItem(nav)
    setModalType('NavDelete')
  }

  return (
    <NavModal
      confirmText="Create new"
      closeText="Cancel"
      titleText="Navigation overview"
      loadingText='Creating'
      modalToOpen='NavCreate'
    >
      {navigations.length > 0 ? navigations.map((nav, index) => (
        <Box key={nav.id}>
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
        </Box>
      )) :
        <Center height={100}>
          <Typography textColor="neutral800">
            No navigations available.
          </Typography>
        </Center>
      }
    </NavModal>
  )
}