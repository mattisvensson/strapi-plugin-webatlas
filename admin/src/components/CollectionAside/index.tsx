import { Typography } from '@strapi/design-system/Typography';
import { Divider } from '@strapi/design-system/Divider';
import { Flex } from '@strapi/design-system/Flex';
import { Combobox, ComboboxOption, BaseCheckbox, Box, TextInput, ToggleInput, GridLayout  } from '@strapi/design-system';
import { useState } from 'react';
import transformToUrl from '../../utils/transformToUrl';

const CollectionAside = () => {
  const [title, setTitle] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [isDisabled, setIsDisabled] = useState(true);

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
        />
        <ToggleInput
          label="Attach to menu"
          offLabel="No"
          onLabel="Yes"
        />
        <Combobox
          id="parent-select"
          label="Parent"
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
      </Flex>
    </Box>
  )
};

export default CollectionAside;
