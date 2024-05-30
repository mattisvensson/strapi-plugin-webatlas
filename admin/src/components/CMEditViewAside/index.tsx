import { MultiSelect, MultiSelectOption, BaseCheckbox, Box, TextInput, ToggleInput, Button, Flex, Divider, Typography } from '@strapi/design-system';
import { useState, useEffect } from 'react';
import transformToUrl from '../../../../utils/transformToUrl';
import { useFetchClient, useCMEditViewDataManager } from '@strapi/helper-plugin';
import useApi from '../../hooks/useApi';
import useNavigations from '../../hooks/useNavigations';
import { NavItem, RouteSettings } from '../../../../types';
import usePluginConfig from '../../hooks/usePluginConfig';

const CMEditViewAside = () => {
  const { layout, initialData } = useCMEditViewDataManager()
  const { get } = useFetchClient();

  const [routeId, setRouteId] = useState()
  const [title, setTitle] = useState('')
  const [path, setPath] = useState('')
  const [attachedToMenu, setAttachedToMenu] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [attachedNavigation, setAttachedNavigation] = useState<number[]>([])
  const [isDisabled, setIsDisabled] = useState(true);
  const [isHidden, setIsHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [navigations, fetchNavigations] = useNavigations() as [NavItem[], () => Promise<void>]
  const [isNewRoute, setIsNewRoute] = useState(false)
  const { data: config } = usePluginConfig()
  const { createRoute, updateRoute } = useApi();

  useEffect(() => {
    async function getTypes () {
      if (!config) return

      if (config?.selectedContentTypes?.includes(layout.uid)) {
        setIsHidden(false);

        try {
          const { data } = await get(`/content-manager/collection-types/plugin::url-routes.route?filters[relatedId][$eq]=${initialData.id}&populate[navigation]`);
          const route = data.results[0]

          if (!route) setIsNewRoute(true)

          setRouteId(route.id)
          setTitle(route ? route.title : '')
          setPath(route ? route.path : '')
          setAttachedToMenu(route ? route.menuAttached : true)
          setIsInternal(route ? route.isInternal : true)
          setAttachedNavigation(route ? route.navigation.map((nav: { id: number }) => JSON.stringify(nav.id)) : [])
        } catch (err) {
          console.log(err)
        }
      }
      setIsLoading(false);
    }
    getTypes();
  }, [config])

  const onSubmit = async () => {
    if (!initialData.id) return;
    const settings: RouteSettings = {
      title,
      path,
      menuAttached: attachedToMenu,
      relatedContentType: layout.uid,
      relatedId: initialData.id,
      navigation: attachedNavigation,
    }
    if (isNewRoute) {
      await createRoute(settings);
    } else if (routeId) {
      await updateRoute(settings, routeId);
    }
  };

  const handleCheckboxChange = () => {
    setIsDisabled(prev => !prev);
    setPath(transformToUrl(title))
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (isDisabled) {
      setPath(transformToUrl(e.target.value));
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDisabled) {
      setPath(e.target.value);
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
        <Box>
          <TextInput
            id="url-input"
            label="URL"
            value={path}
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
        <ToggleInput
          label="Attach to menu"
          offLabel="No"
          onLabel="Yes"
          onChange={() => setAttachedToMenu((prev: boolean) => !prev)}
          checked={attachedToMenu}
        />
        {attachedToMenu &&
          <>
            <ToggleInput
              label="Internal Link"
              offLabel="No"
              onLabel="Yes"
              onChange={() => setIsInternal((prev: boolean) => !prev)}
              checked={isInternal}
            />
            <MultiSelect
              id="navigation-select"
              label="Select Navigation"
              onChange={(value: number[]) => setAttachedNavigation(value)}
              value={attachedNavigation}
              withTags
            >
              {navigations.map((nav) => (
                <MultiSelectOption key={nav.id} value={nav.id}>
                  {nav.name}
                </MultiSelectOption>
              ))}
            </MultiSelect>
          </>
        }
        <Button onClick={() => onSubmit()}>Save</Button>
      </Flex>}
    </Box>
  )
};

export default CMEditViewAside;
