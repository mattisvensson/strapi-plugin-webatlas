import { Grid, Toggle, Field, Box, Button } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import { NestedNavigation } from '../../../../types';
import NavModal from './NavModal'
import { useApi } from '../../hooks';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

type NavEditProps = {
  item: NestedNavigation;
  fetchNavigations: () => void;
}

export default function NavEdit({ item, fetchNavigations }: NavEditProps) {
  const { setModalType } = useContext(ModalContext);
  const [name, setName] = useState(item.name)
  const [visible, setVisible] = useState(item.visible)
  const [loading, setLoading] = useState(false)
  const { updateNavigation } = useApi();
  const { formatMessage } = useIntl();

  const updateNav = async () => {
    setLoading(true);
    try {
      await updateNavigation(item.documentId, { name, visible });
      fetchNavigations()
      setModalType('NavOverview')
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <NavModal
      confirmText={formatMessage({ id: getTranslation('modal.navEdit.confirmText'), defaultMessage: 'Create' })}
      closeText={formatMessage({ id: getTranslation('modal.navEdit.closeText'), defaultMessage: 'Cancel' })}
      titleText={formatMessage({ id: getTranslation('modal.navEdit.titleText'), defaultMessage: 'Edit navigation:' }) + " " + item.name}
      loadingText={formatMessage({ id: getTranslation('modal.navEdit.loadingText'), defaultMessage: 'Updating' })}
      onConfirm={updateNav}
      loading={loading}
      modalToOpen='NavOverview'
      footer={
        <>
          <Button onClick={() => setModalType('NavOverview')} variant="tertiary">
            {formatMessage({
              id: getTranslation('modal.navEdit.closeText'),
              defaultMessage: 'Cancel'
            })}
          </Button>
          <Button>
            {formatMessage({
              id: getTranslation('modal.navEdit.confirmText'),
              defaultMessage: 'Update'
            })}
          </Button>
        </>
      }
    >
      <Grid.Root gap={4}>
        <Grid.Item s={12} m={6}>
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
        <Grid.Item s={12} m={6}>
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
                checked={visible}
                onChange={() => setVisible(prev => !prev)}
              />
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
    </NavModal>
  )
}