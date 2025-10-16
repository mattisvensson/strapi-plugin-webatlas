import { useState, useEffect } from 'react';
import { unstable_useContentManagerContext as useContentManagerContext, } from '@strapi/strapi/admin';
import { Typography, Link } from '@strapi/design-system';
import { ConfigContentType } from '../../../../types';
import { usePluginConfig, useAllContentTypes } from '../../hooks';
import Alias from './Alias';
// import Navigation from './Navigation';

const CMEditViewAside = () => {
  const { model } = useContentManagerContext()
  const { contentTypes } = useAllContentTypes()
  const { data: config } = usePluginConfig()

  const [contentTypeConfig, setContentTypeConfig] = useState<ConfigContentType | null>(null);
  const [isAllowedContentType, setIsAllowedContentType] = useState(false);
  const [isActiveContentType, setIsActiveContentType] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!config) return
    
    const modelConfig = contentTypes?.find((ct) => ct.uid === model)
    if (modelConfig?.pluginOptions?.webatlas?.active) setIsAllowedContentType(true)
    
    config?.selectedContentTypes?.map((type) => {
      if (type.uid === model) {
        setIsActiveContentType(true);
        setContentTypeConfig(type);
      }
    })
    setIsLoading(false);
  }, [config])

  useEffect(() => {
    const label = Array.from(document.querySelectorAll('label')).find((l) => l.textContent?.startsWith('webatlas_path'));
    if (label) {
      let parentDiv = label.closest('div');
      for (let i = 0; i < 2; i++) {
        if (parentDiv) {
          // @ts-expect-error
          parentDiv = parentDiv.parentElement;
        }
      }
      if (parentDiv) {
        const grandParentDiv = parentDiv.parentElement;
        if (grandParentDiv && grandParentDiv.children.length === 1) {
          grandParentDiv.parentElement?.remove();
          return;
        } else {
          parentDiv.remove();
        }
      }
    }
  }, []);

  if (!isLoading) return (
    <Typography textColor="neutral600">
      Loading...
    </Typography>
  )

  if (!isAllowedContentType) return (
    <Typography textColor="neutral600">
      This content type is not allowed for <strong>WebAtlas</strong>. 
      If you wish to use it, please contact your administrator. 
    </Typography>
  )

  if (isActiveContentType || !contentTypeConfig) return (
    <Typography textColor="neutral600">
      This content type is not configured for <strong>WebAtlas</strong>. 
      If you wish to use it, please configure it in the 
      <Link href="/admin/settings/webatlas/configuration" marginLeft={1}>
        settings
      </Link>.
    </Typography>
  )

  return (
    <>
      <Alias config={contentTypeConfig}/>
      {/* <Navigation/> */}
    </>
  )
};

export default CMEditViewAside;