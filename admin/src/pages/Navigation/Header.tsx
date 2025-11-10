import { Flex, Button, SingleSelect, SingleSelectOption} from '@strapi/design-system';
import { NestedNavigation } from '../../../../types';
import { useContext } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';

type HeaderProps = {
  navigations: NestedNavigation[]
}

export default function Header ({ navigations }: HeaderProps) {

  const { setModalType } = useContext(ModalContext);
  const { selectedNavigation, setSelectedNavigation } = useContext(SelectedNavigationContext);

  const { formatMessage } = useIntl();

  return (
    <Flex gap={4}>
      <Button variant="secondary" onClick={() => setModalType('NavOverview')}>
        {formatMessage({
          id: getTranslation('manage'),
          defaultMessage: 'Manage',
        })}
      </Button>
      <SingleSelect
        value={selectedNavigation ? selectedNavigation.slug : ''} 
        placeholder={formatMessage({
          id: getTranslation('navigation.page.selectNavigation'),
          defaultMessage: 'Select Navigation',
        })}
        onChange={(value: string) => {
          const navItem = navigations.find(nav => nav.slug === value);
          if (navItem) {
            setSelectedNavigation(navItem);
          }
        }}
        disabled={navigations.length === 0}
      >
        {navigations.map((nav) => (
          <SingleSelectOption key={nav.id} value={nav.slug}>{nav.name}</SingleSelectOption>
        ))}
      </SingleSelect>
    </Flex>
  )
}