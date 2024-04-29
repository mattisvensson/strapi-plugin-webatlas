import { Typography } from '@strapi/design-system/Typography';
import { Divider } from '@strapi/design-system/Divider';
import { Flex } from '@strapi/design-system/Flex';
import { Combobox, ComboboxOption, BaseCheckbox, Box, TextInput, ToggleInput, Button  } from '@strapi/design-system';
import { useState, useEffect } from 'react';
import transformToUrl from '../../utils/transformToUrl';
import { useFetchClient, useCMEditViewDataManager } from '@strapi/helper-plugin';
import { createUrlAlias, updateUrlAlias } from '../../utils/api';

const CMEditViewAside = () => {
  const { layout, modifiedData, initialData, slug } = useCMEditViewDataManager()
  const { get } = useFetchClient();

  const [title, setTitle] = useState(initialData?.url_route?.title || '')
  const [urlTitle, setUrlTitle] = useState(initialData?.url_route?.url_route || '')
  const [attachedToMenu, setAttachedToMenu] = useState(initialData?.url_route?.menuAttached || false)
  const [parent, setParent] = useState(initialData.url_route?.parent || null)
  const [isDisabled, setIsDisabled] = useState(true);
  const [isHidden, setIsHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [entities, setEntities] = useState([])


  useEffect(() => {
    async function getTypes () {
      const { data } = await get('/url-routes/config', {
        method: 'GET',
      })
      console.log(data)
      if (data?.selectedContentTypes?.includes(layout.uid)) {
        // Fetch all entities from the selected content types
        const entities = await Promise.all(
          data?.selectedContentTypes?.map(async (contentType) => {
            const { data: entities } = await get(`/content-manager/collection-types/${contentType}`);
            return entities;
          }) || []
        );
  
        const mergedEntities = entities.flat(); // Merge the arrays into one

        console.log(mergedEntities); // Log the merged entities
        setEntities(mergedEntities)
        setIsHidden(false);
      }
      setIsLoading(false);
    }
    getTypes();
  }, [])
  
  const onSubmit = async () => {
    if (!initialData.id) return;
    const settings = {
      id: modifiedData.id,
      title,
      menuAttached: attachedToMenu,
      parent,
      url_route: urlTitle,
      routeId: initialData.url_route?.routeId
    }
    if (initialData.url_route) {
      await updateUrlAlias(settings, slug);
    } else {
      await createUrlAlias(settings, slug);
    }
  };

  const handleCheckboxChange = () => {
    setIsDisabled(prev => !prev);
    setUrlTitle(transformToUrl(title))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (isDisabled) {
      setUrlTitle(transformToUrl(e.target.value));
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDisabled) {
      setUrlTitle(e.target.value);
    }
  }

  if (isHidden || isLoading) return null;

  return (
    <Box
      as="aside"
      aria-labelledby="URL Route"
      background='neutral0'
      borderColor="neutral150"
      hasRadius
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={6}
      shadow="tableShadow"
    >
      <Typography
        variant="sigma"
        textColor="neutral600"
        id="url-route"
        paddingBottom={4}
      >
        URL Route
      </Typography>
      <Box
        paddingTop={2}
        paddingBottom={4}
      >
        <Divider />
      </Box>
      {!initialData.id ? 
      <Typography
        textColor="neutral600"
        id="save-first"
        paddingBottom={4}
      >
        Please save the entry to generate a URL
      </Typography>
      : 
      <Flex
        direction='column'
        alignItems='stretch'
        gap={4}
      >
        <TextInput
          id="page-title"
          label="Title"
          placeholder="Title"
          onChange={handleTitleChange}
          value={title}
        />
        <ToggleInput
          label="Attach to menu"
          offLabel="No"
          onLabel="Yes"
          onChange={() => setAttachedToMenu((prev: boolean) => !prev)}
          checked={attachedToMenu}
        />
        <Combobox
          id="parent-select"
          label="Parent"
          onChange={(value: string) => setParent(value)}
          value={parent}
        >
          <ComboboxOption value="internal">Internal</ComboboxOption>
          <ComboboxOption value="external">External</ComboboxOption>
        </Combobox>
        <Box>
          <TextInput
            id="url-input"
            label="URL"
            value={urlTitle}
            onChange={handleUrlChange}
            disabled={isDisabled}
          />
          <Flex
            gap={2}
            paddingTop={2}
          >
            <BaseCheckbox
              id="override-url"
              checked={!isDisabled}
              onChange={()=> handleCheckboxChange()}
            />
            <label htmlFor='override-url'>
              <Typography textColor="neutral600">
                Override automatic URL
              </Typography>
            </label>
          </Flex>
        </Box>
        <Button onClick={() => onSubmit()}>Save</Button>
      </Flex>}
    </Box>
  )
};

export default CMEditViewAside;
