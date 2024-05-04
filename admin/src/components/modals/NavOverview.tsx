import { Flex, Box, Typography, Divider, Button } from '@strapi/design-system';
import { Check, Pencil, Trash } from '@strapi/icons';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { useContext } from 'react';
import { NavItem } from '../../types';

type NavOverviewProps = {
  navigations: NavItem[],
  setActionNavigation: React.Dispatch<React.SetStateAction<NavItem |undefined>>
}

export default function NavOverview ({ navigations, setActionNavigation }: NavOverviewProps) {

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

  const handleDelete = (nav: NavItem) => {
    setActionNavigation(nav)
    setOpenModal('delete')
  }

  return (
    <>
      {navigations.map((nav, index: number) => (
        <>
          <Flex justifyContent="space-between" key={`box-${nav.slug}`}>
            <Typography textColor="neutral800">
              {nav.name}
            </Typography>
            <Flex gap={2}>
              <Button startIcon={<Trash />} variant="secondary" onClick={() => handleDelete(nav)}>Delete</Button>
              <Button startIcon={<Pencil />} variant="secondary">Edit</Button>
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
    </>
  )
}