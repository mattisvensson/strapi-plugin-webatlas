import {
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { Flex, Button } from '@strapi/design-system';
import { NestedNavigation } from '../../../../types';
import { useContext } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';

type HeaderProps = {
  navigations: NestedNavigation[]
}

export default function Header ({ navigations }: HeaderProps) {

  const ModalContextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};  
  if (ModalContextValue !== null) {
    [, setOpenModal] = ModalContextValue;
  }

  const SelectedContextValue = useContext(SelectedNavigationContext);
  let setSelectedNavigation = (_: NestedNavigation) => {};  
  let selectedNavigation: NestedNavigation | undefined = undefined
  if (SelectedContextValue !== null) {
    [selectedNavigation, setSelectedNavigation] = SelectedContextValue;
  }
  
  return (
    <Flex gap={4}>
      <Button variant="secondary" onClick={() => setOpenModal('overview')}>
        Manage
      </Button>
      <SingleSelect
        value={selectedNavigation ? selectedNavigation.slug : ''} 
        placeholder="Select Navigation" 
        onChange={(value: string) => {
          const navItem = navigations.find(nav => nav.slug === value);
          if (navItem) {
            setSelectedNavigation(navItem);
          }
        }}
        disabled={navigations.length === 0}>
        {navigations.map((nav) => (
          <SingleSelectOption key={nav.id} value={nav.slug}>{nav.name}</SingleSelectOption>
        ))}
      </SingleSelect>
    </Flex>
  )
}