import { Flex, Box, Typography, Divider, Button } from '@strapi/design-system';
import { Check, Pencil, Trash } from '@strapi/icons';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { useContext } from 'react';
import { NestedNavItem, NestedNavigation } from '../../../../types';
import { NavModal } from '../modals';
import Center from '../UI/Center';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';
import { useNavigate  } from 'react-router-dom';
import { PLUGIN_ID } from '../../../../utils';

type NavOverviewProps = {
  navigations: NestedNavigation[],
  setActionItem: React.Dispatch<React.SetStateAction<NestedNavItem | NestedNavigation | undefined>>
}

export default function NavOverview ({ navigations, setActionItem }: NavOverviewProps) {

  const { setModalType } = useContext(ModalContext);
  const { selectedNavigation } = useContext(SelectedNavigationContext);
	const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const handleSelect = (nav: NestedNavigation) => {
    navigate(`/plugins/${PLUGIN_ID}/navigation/${nav.documentId}`);
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
      confirmText={formatMessage({
        id: getTranslation('modal.navOverview.confirmText'),
        defaultMessage: 'New navigation'
      })}
      closeText={formatMessage({
        id: getTranslation('modal.navOverview.closeText'),
        defaultMessage: 'Cancel'
      })}
      titleText={formatMessage({
        id: getTranslation('modal.navOverview.titleText'),
        defaultMessage: 'Navigation overview'
      })}
      loadingText={formatMessage({
        id: getTranslation('modal.navOverview.loadingText'),
        defaultMessage: 'Creating'
      })}
      modalToOpen='NavCreate'
    >
      {navigations.length > 0 ? navigations.map((nav, index) => (
        <Box key={nav.id}>
          <Flex justifyContent="space-between" key={`box-${nav.slug}`}>
            <Typography textColor="neutral800">
              {nav.name}
            </Typography>
            <Flex gap={2}>
              <Button startIcon={<Trash />} variant="danger-light" onClick={() => handleDelete(nav)}>
              {formatMessage({
                id: getTranslation('delete'),
                defaultMessage: 'Delete'
              })}
              </Button>
              <Button startIcon={<Pencil />} variant="secondary" onClick={() => handleEdit(nav)}>
                {formatMessage({
                  id: getTranslation('edit'),
                  defaultMessage: 'Edit'
                })}
              </Button>
              <Button
                startIcon={<Check />}
                variant="primary"
                onClick={() => handleSelect(nav)}
                disabled={selectedNavigation ? selectedNavigation.slug === nav.slug : false}
              >
                {formatMessage({
                  id: getTranslation('select'),
                  defaultMessage: 'Select'
                })}
              </Button>
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
            {formatMessage({
              id: getTranslation('navigation.page.emptyNavigation'),
              defaultMessage: 'You have no navigations yet...'
            })}
          </Typography>
        </Center>
      }
    </NavModal>
  )
}