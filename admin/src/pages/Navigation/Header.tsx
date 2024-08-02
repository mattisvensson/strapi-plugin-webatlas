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

  const { setModal } = useContext(ModalContext);
  const { selectedNavigation, setSelectedNavigation } = useContext(SelectedNavigationContext);

  return (
    <Flex gap={4}>
      <Button variant="secondary" onClick={() => setModal('overview')}>
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