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

  if (isHidden || isLoading || !contentTypeConfig) return null;

  return (
    <>
      <Alias config={contentTypeConfig}/>
      {/* <Navigation/> */}
    </>
  )
};

export default CMEditViewAside;