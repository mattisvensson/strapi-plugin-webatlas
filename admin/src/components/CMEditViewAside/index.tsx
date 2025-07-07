import { useState, useEffect } from 'react';
import { unstable_useContentManagerContext as useContentManagerContext, } from '@strapi/strapi/admin';
import { ConfigContentType } from '../../../../types';
import usePluginConfig from '../../hooks/usePluginConfig';
import Alias from './Alias';
// import Navigation from './Navigation';

const CMEditViewAside = () => {
  const { model } = useContentManagerContext()
  const { data: config } = usePluginConfig()

  const [contentTypeConfig, setContentTypeConfig] = useState<ConfigContentType | null>(null);
  const [isHidden, setIsHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!config) return

    config?.selectedContentTypes?.map((type) => {
      if (type.uid === model) {
        setIsHidden(false);
        setContentTypeConfig(type);
      }
    })
    setIsLoading(false);
  }, [config])

  if (isHidden || isLoading || !contentTypeConfig) return null;

  return (
    <>
      <Alias config={contentTypeConfig}/>
      {/* <Navigation/> */}
    </>
  )
};

export default CMEditViewAside;