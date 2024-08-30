import { Grid, GridItem, TextInput, ToggleInput } from '@strapi/design-system';
import { ModalLayout, ModalBody, ModalFooter, Button } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import ModalHeader from './ModalHeader';
import { useFetchClient } from '@strapi/helper-plugin';

export default function NavCreate ({ fetchNavigations }: { fetchNavigations: () => void}){
  const { post } = useFetchClient();

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  const { setModal } = useContext(ModalContext);

  const createNavigation = async () => {
    try {
      await post('/webatlas/navigation', { name, isActive });
      fetchNavigations()
      setModal('overview')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <ModalLayout onClose={() => setModal('')}>
      <ModalHeader title="Create new navigation"/>
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
        endActions={<Button onClick={() => createNavigation()}>Create</Button>}
      />
    </ModalLayout>
  )
}