import type{ NestedNavigation } from '../../../../types';
import { Layouts, Page } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { useContext } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';
import { Flex, Button, Box, Typography, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useNavigate } from 'react-router-dom';

export default function PageWrapper({ navigations, loading = false, children }: { navigations: NestedNavigation[], loading?: boolean, children: React.ReactNode }) {
  const { formatMessage } = useIntl();
  const { selectedNavigation } = useContext(SelectedNavigationContext);
  const { setModalType } = useContext(ModalContext);
  const navigate = useNavigate();

  return (
    <Page.Main>
      <Layouts.Header
        title={formatMessage({
          id: getTranslation('navigation.page.title'),
          defaultMessage: 'Navigation',
        }) + (selectedNavigation ? `: ${selectedNavigation.name}` : '')}
        subtitle={
          <Typography textColor="neutral500">
            {selectedNavigation ? 
              `ID: ${selectedNavigation.id} | DocumentID : ${selectedNavigation.documentId}` : 
              formatMessage({
                id: getTranslation('navigation.page.subtitle.noNavigationSelected'),
                defaultMessage: 'No navigation selected',
              })}
          </Typography>
        }
        primaryAction={ !loading && 
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
                navItem && navigate(`/plugins/webatlas/navigation/${navItem.documentId}`);
              }}
              disabled={navigations.length === 0}
            >
              {navigations.map((nav) => (
                <SingleSelectOption key={nav.id} value={nav.slug}>{nav.name}</SingleSelectOption>
              ))}
            </SingleSelect>
          </Flex>
        }
      />
      <Layouts.Content>
        <Box>
          {children}
        </Box>
      </Layouts.Content>
    </Page.Main>
  )
}