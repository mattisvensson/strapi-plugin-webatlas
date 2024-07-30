import { ModalLayout, ModalBody, ModalFooter, Button, TextInput, Grid, GridItem } from '@strapi/design-system';
import { useState, useContext } from 'react';
import { ModalContext } from '../../contexts';
import ModalHeader from './ModalHeader';
import { NavItemSettings, NestedNavigation } from '../../../../types';
import useApi from '../../hooks/useApi';

type ItemOverviewProps = {
  fetchNavigations: () => void;
  navigation: NestedNavigation;
  parentId?: number;
}

export default function ExternalCreate ({ fetchNavigations, navigation, parentId }: ItemOverviewProps){
  const { createNavItem, createExternalRoute} = useApi();

  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');


  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }




  const addItem = async () => {
    try {

      console.log(path, title)
      if (!path || !title) return

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
        navigation: navigation.id,
      }

      await createNavItem(settings);

      fetchNavigations()
      setOpenModal('')
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <ModalLayout onClose={() => setOpenModal('')}>
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
        startActions={<Button onClick={() => setOpenModal('')} variant="tertiary">Cancel</Button>}
        endActions={
          <>
            <Button variant="secondary" onClick={() => setOpenModal('ItemCreate')}>Add internal link</Button>
            <Button variant="secondary" onClick="">Add wrapper component</Button>
            <Button disabled={!title || !path} onClick={() => addItem()}>Add item</Button>
          </>
        }
      />
    </ModalLayout>
  )
}
