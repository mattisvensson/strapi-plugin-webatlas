import { useState, useContext } from 'react';
import { Grid, Box, Field } from '@strapi/design-system';
import { useNotification, useFetchClient } from '@strapi/strapi/admin';
import NavModal from './NavModal';
import { ModalContext } from '../../contexts';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';
import { useNavigate  } from 'react-router-dom';
import { PLUGIN_ID } from '../../../../utils';

export default function NavCreate() {
  const { post } = useFetchClient();
  const { setModalType } = useContext(ModalContext);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true) // Temporary not used
  const [loading, setLoading] = useState(false)
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const navigate = useNavigate();

  const createNavigation = async () => {
    setLoading(true);
    try {
      const { data } = await post(`/${PLUGIN_ID}/navigation`, { name, isActive });

      if (!data.documentId) throw new Error('No documentId returned');

      navigate(`/plugins/${PLUGIN_ID}/navigation/${data.documentId}`);
      setModalType('');
      
    } catch (err) {
      console.log(err);
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('notification.navigation.creationFailed'),
          defaultMessage: 'Creation of navigation failed',
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <NavModal
      confirmText={formatMessage({ id: getTranslation('modal.navCreate.confirmText'), defaultMessage: 'Create' })}
      closeText={formatMessage({ id: getTranslation('modal.navCreate.closeText'), defaultMessage: 'Cancel' })}
      titleText={formatMessage({ id: getTranslation('modal.navCreate.titleText'), defaultMessage: 'Create new navigation' })}
      loadingText={formatMessage({ id: getTranslation('modal.navCreate.loadingText'), defaultMessage: 'Creating' })}
      onConfirm={createNavigation}
      loading={loading}
    >
      <Grid.Root gap={4}>
        <Grid.Item col={12} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.nameField.label'),
                  defaultMessage: 'Name'
                })}
              </Field.Label>
              <Field.Input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </Field.Root>
          </Box>
        </Grid.Item>
        {/* <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>
                {formatMessage({
                  id: getTranslation('modal.activeField.label'),
                  defaultMessage: 'Active'
                })}
              </Field.Label>
              <Toggle
                onLabel={formatMessage({
                  id: getTranslation('modal.activeField.onLabel'),
                  defaultMessage: 'Yes'
                })}
                offLabel={formatMessage({
                  id: getTranslation('modal.activeField.offLabel'),
                  defaultMessage: 'No'
                })}
                checked={isActive}
                onChange={() => setIsActive(prev => !prev)}
              />
            </Field.Root>
          </Box>
        </Grid.Item> */}
      </Grid.Root>
    </NavModal>
  );
}