import { Grid, Toggle, Field, Box, Button } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import { useFetchClient } from '@strapi/strapi/admin';
import { NestedNavigation } from '../../../../types';
import NavModal from './NavModal'

type NavEditProps = {
  item: NestedNavigation;
  fetchNavigations: () => void;
}

export default function NavEdit({ item, fetchNavigations }: NavEditProps) {
  const { put } = useFetchClient();
  const { setModalType } = useContext(ModalContext);
  const [name, setName] = useState(item.name)
  const [isActive, setIsActive] = useState(item.visible)
  const [loading, setLoading] = useState(false)

  const updateNavigation = async () => {
    setLoading(true);
    try {
      await put(`/webatlas/navigation/${item.id}`, { name, isActive });
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
      onConfirm={updateNavigation}
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
        <Grid.Item col={6}>
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Field.Input
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </Field.Root>
        </Grid.Item>
        <Grid.Item col={6}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>Active</Field.Label>
              <Toggle onLabel="Yes" offLabel="No" checked={isActive} onChange={() => setIsActive(prev => !prev)} />
            </Field.Root>
          </Box>
        </Grid.Item>
      </Grid.Root>
    </NavModal>
  )
}