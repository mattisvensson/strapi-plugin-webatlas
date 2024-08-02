import { Flex, Box, Typography, Divider, Button, ModalLayout, ModalBody, ModalFooter } from '@strapi/design-system';
import { Check, Pencil, Trash } from '@strapi/icons';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { useContext, useEffect } from 'react';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import ModalHeader from './ModalHeader';

type NavOverviewProps = {
  navigations: NestedNavigation[],
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>
}

export default function NavOverview ({ navigations, setActionItem }: NavOverviewProps) {

  const { setModal } = useContext(ModalContext);
  const { selectedNavigation, setSelectedNavigation } = useContext(SelectedNavigationContext);

  const handleSelect = (nav: NestedNavigation) => {
    setSelectedNavigation(nav)
    setModal('')
  }

  const handleEdit = (nav: NestedNavigation) => {
    setActionItem(nav)
    setModal('edit')
  }

  const handleDelete = (nav: NestedNavigation) => {
    setActionItem(nav)
    setModal('NavDelete')
  }

  useEffect(() => {
    console.log(navigations)
  }, [])

  return (
    <ModalLayout onClose={() => setModal('')}>
      <ModalHeader title="Navigation overview"/>
      <ModalBody>
        {navigations.map((nav, index) => (
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
        ))}
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setModal('')} variant="tertiary">Cancel</Button>}
        endActions={<Button onClick={() => setModal('create')}>Create new</Button>}
      />
    </ModalLayout>
  )
}
