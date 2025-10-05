import { Grid, Toggle, Field, Box, Button } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import { NestedNavigation } from '../../../../types';
import NavModal from './NavModal'
import { useApi } from '../../hooks';

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
      confirmText="Create"
      closeText="Cancel"
      titleText={`Edit navigation: ${item.name}`}
      loadingText='Creating'
      onConfirm={updateNav}
      loading={loading}
      modalToOpen='NavOverview'
      footer={
        <>
          <Button onClick={() => setModalType('NavOverview')} variant="tertiary">Cancel</Button>
          <Button>Update</Button>
        </>
      }
    >
      <Grid.Root gap={4}>
        <Grid.Item s={12} m={6}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>Name</Field.Label>
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
              <Field.Label>Active</Field.Label>
              <Toggle onLabel="Yes" offLabel="No" checked={visible} onChange={() => setVisible(prev => !prev)} />
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
    </NavModal>
  )
}