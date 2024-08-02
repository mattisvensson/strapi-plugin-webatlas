import { ModalLayout, ModalBody, ModalFooter, Button, TextInput, Grid, GridItem } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext, SelectedNavigationContext } from '../../contexts';

import ModalHeader from './ModalHeader';
import { NavItemSettings } from '../../../../types';
import useApi from '../../hooks/useApi';

type ItemOverviewProps = {
  fetchNavigations: () => void;
  parentId?: number;
}

export default function ExternalCreate ({ fetchNavigations, parentId }: ItemOverviewProps){
  const { createNavItem, createExternalRoute} = useApi();

  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');

  const { setModal } = useContext(ModalContext);
  const { selectedNavigation } = useContext(SelectedNavigationContext);

  const addItem = async () => {
    try {

      if (!path || !title || !selectedNavigation) return

      const route = await createExternalRoute({
        title,
        internal: false,
        active: true,
        relatedId: 0,
        relatedContentType: '',
        fullPath: path
      })
      console.log(route)

      if (!route) return

      const settings: NavItemSettings = {
        route: route.id,
        parent: parentId ?? null,
        navigation: selectedNavigation.id,
      }

      await createNavItem(settings);

      fetchNavigations()
      setModal('')
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <ModalLayout onClose={() => setModal('')}>
      <ModalHeader title="Add new navigation item"/>
      <ModalBody>
        <Grid gap={8}>
          <GridItem col={6}>
            <TextInput
              placeholder="My Title"
              label="Title"
              name="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              required
            />
          </GridItem>
          <GridItem col={6}>
            <TextInput
              required
              placeholder="https://example.com"
              label="Path"
              name="slug"
              value={path}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)}
  
            />
          </GridItem>
        </Grid>
      </ModalBody>
      <ModalFooter
        startActions={<Button onClick={() => setModal('')} variant="tertiary">Cancel</Button>}
        endActions={
          <>
            <Button variant="secondary" onClick={() => setModal('ItemCreate')}>Add internal link</Button>
            <Button variant="secondary" onClick="">Add wrapper component</Button>
            <Button disabled={!title || !path} onClick={() => addItem()}>Add item</Button>
          </>
        }
      />
    </ModalLayout>
  )
}
