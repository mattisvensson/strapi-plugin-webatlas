import { Grid, TextInput, Toggle } from '@strapi/design-system';
import { Modal, Button } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import { useFetchClient } from '@strapi/strapi/admin';
import { NestedNavigation } from '../../../../types';

type NavEditProps = {
  item: NestedNavigation;
  fetchNavigations: () => void;
}

export default function NavEdit ({ item, fetchNavigations }: NavEditProps){
  const { put } = useFetchClient();

  const [name, setName] = useState(item.name)
  const [isActive, setIsActive] = useState(item.visible)

  const { setModalType } = useContext(ModalContext);

  const updateNavigation = async () => {
    try {
      await put(`/webatlas/navigation/${item.id}`, { name, isActive });
      fetchNavigations()
      setModalType('NavOverview')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Modal.Root onClose={() => setModalType('')}>
      <Modal.Header title={`Edit navigation: ${item.name}`}/>
      <Modal.Body>
        <Grid gap={4}>
          <Grid.Item col={6}>
            <TextInput label="Name" aria-label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}/>
          </Grid.Item>
          <Grid.Item col={6}>
            <Toggle onLabel="Yes" offLabel="No" label="Active" aria-label="Active" checked={isActive} onChange={() => setIsActive(prev => !prev)}/>
          </Grid.Item>
        </Grid>
      </Modal.Body>
      <Modal.Footer
        startActions={<Button onClick={() => setModalType('NavOverview')} variant="tertiary">Cancel</Button>}
        endActions={<Button onClick={() => updateNavigation()}>Update</Button>}
      />
    </Modal.Root>
  )
}