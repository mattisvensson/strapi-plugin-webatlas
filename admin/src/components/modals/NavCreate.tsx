import { useState, useContext } from 'react';
import { Grid, Box, Field } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import NavModal from './NavModal';
import { ModalContext, SelectedNavigationContext } from '../../contexts';

export default function NavCreate() {
  const { post } = useFetchClient();
  const { setModalType } = useContext(ModalContext);
  const { setSelectedNavigation } = useContext(SelectedNavigationContext);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true) // Temporary not used
  const [loading, setLoading] = useState(false)

  const createNavigation = async () => {
    setLoading(true);
    try {
      const { data } = await post('/webatlas/navigation', { name, isActive });
      setSelectedNavigation(data);
      setModalType('');
    } catch (err) {
      console.log(err);
    } finally {

    }
    setLoading(false);
  };

  return (
    <NavModal
      confirmText="Create"
      closeText="Cancel"
      titleText="Create new navigation"
      loadingText='Creating'
      onConfirm={createNavigation}
      loading={loading}
    >
      <Grid.Root gap={4}>
        <Grid.Item col={12} s={12}>
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
        {/* <Grid.Item col={6} s={12}>
          <Box width="100%">
            <Field.Root>
              <Field.Label>Active</Field.Label>
              <Toggle onLabel="Yes" offLabel="No" checked={isActive} onChange={() => setIsActive(prev => !prev)} />
            </Field.Root>
          </Box>
        </Grid.Item> */}
      </Grid.Root>
    </NavModal>
  );
}