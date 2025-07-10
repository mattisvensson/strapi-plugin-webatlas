import { useState } from 'react';
import { Grid, Toggle, Box, Field } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import NavModal from './NavModal';

export default function NavCreate() {
  const { post } = useFetchClient();
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createNavigation = async () => {
    try {
      // await post('/webatlas/navigation', { name, isActive });
      console.log('Creating navigation with name:', name, 'and isActive:', isActive);
      // Optionally: close modal, refresh list, etc.
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <NavModal
      triggerText="Create Navigation"
      confirmText="Create"
      closeText="Cancel"
      titleText="Create new navigation"
      onConfirm={createNavigation} // <-- pass handler here
    >
      <Grid.Root gap={4}>
        <Grid.Item col={6} s={12}>
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