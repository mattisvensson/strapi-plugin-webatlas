import { Grid, GridItem, TextInput, ToggleInput } from '@strapi/design-system';
import { ModalLayout, ModalBody, ModalFooter, Button } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import ModalHeader from './ModalHeader';
import { useFetchClient } from '@strapi/helper-plugin';
import { NestedNavigation } from '../../../../types';

type NavEditProps = {
  item: NestedNavigation;
  fetchNavigations: () => void;
}

export default function NavEdit ({ item, fetchNavigations }: NavEditProps){
  const { put } = useFetchClient();

  const [name, setName] = useState(item.name)
  const [isActive, setIsActive] = useState(item.visible)

  const { setModal } = useContext(ModalContext);

  const updateNavigation = async () => {
    try {
      await put(`/url-routes/navigation/${item.id}`, { name, isActive });
      fetchNavigations()
      setModal('overview')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <ModalLayout onClose={() => setModal('')}>
      <ModalHeader title={`Edit navigation: ${item.name}`}/>
      <ModalBody>
        <Grid gap={4}>
          <GridItem col={6}>
            <TextInput label="Name" aria-label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}/>
          </GridItem>
          <GridItem col={6}>
            <ToggleInput onLabel="Yes" offLabel="No" label="Active" aria-label="Active" checked={isActive} onChange={() => setIsActive(prev => !prev)}/>
          </GridItem>
        </Grid>
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setModal('overview')} variant="tertiary">Cancel</Button>}
        endActions={<Button onClick={() => updateNavigation()}>Update</Button>}
      />
    </ModalLayout>
  )
}
