import { useState, useEffect } from 'react';
import { unstable_useContentManagerContext as useContentManagerContext, } from '@strapi/strapi/admin';
import { Typography, Link } from '@strapi/design-system';
import { ConfigContentType } from '../../../../types';
import { usePluginConfig, useAllContentTypes } from '../../hooks';
import Alias from './Alias';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { PLUGIN_NAME } from '../../../../pluginId';

// import Navigation from './Navigation';

const CMEditViewAside = () => {
  const { model } = useContentManagerContext()
  const { contentTypes } = useAllContentTypes()
  const { data: config } = usePluginConfig()

  const [contentTypeConfig, setContentTypeConfig] = useState<ConfigContentType | null>(null);
  const [isAllowedContentType, setIsAllowedContentType] = useState(false);
  const [isActiveContentType, setIsActiveContentType] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!config) return
    
    const contentType = contentTypes?.find((ct) => ct.uid === model)
    if (contentType?.pluginOptions?.webatlas?.active) setIsAllowedContentType(true)
    
    config?.selectedContentTypes?.map((type) => {
      if (type.uid === model) {
        setIsActiveContentType(true);
        setContentTypeConfig(type);
      }
    })
    setIsLoading(false);
  }, [config])

  useEffect(() => {
    const isWebatlasLabel = (label: Element) => label.textContent?.startsWith('webatlas_');
    
    document.querySelectorAll('label').forEach(label => {
      if (!isWebatlasLabel(label)) return;
      
      const container = label.parentElement?.parentElement;
      const parent = container?.parentElement;
      const greatGrandParent = parent?.parentElement?.parentElement;
      
      if (!container || !parent) return;
      
      const parentWebatlasCount = Array.from(parent.querySelectorAll('label')).filter(isWebatlasLabel).length;
      const childrenCount = parent.children.length;
      
      // Remove great grandparent if it only has webatlas fields
      if (greatGrandParent && greatGrandParent?.querySelectorAll('label').length === 
          Array.from(greatGrandParent.querySelectorAll('label')).filter(isWebatlasLabel).length) {
        greatGrandParent.remove();
      }
      // Remove parent if: single child OR two children with two webatlas fields  
      else if (childrenCount === 1 || (childrenCount === 2 && parentWebatlasCount === 2)) {
        parent.remove();
      }
      // Remove container if: two children with one webatlas field OR fallback
      else {
        container.remove();
      }
    });
  }, []);

  if (isLoading || !config) return (
    <Typography textColor="neutral600">
      {formatMessage({
        id: getTranslation('components.CMEditViewAside.loading'),
        defaultMessage: 'Loading...',
      })}
    </Typography>
  )

  if (!isAllowedContentType) return (
    <Typography textColor="neutral600">
      {formatMessage({
        id: getTranslation('components.CMEditViewAside.notAllowed.start'),
        defaultMessage: 'This content type is not allowed for',
      })}
      {" "}<strong>{PLUGIN_NAME}</strong>.{" "}
      {formatMessage({
        id: getTranslation('components.CMEditViewAside.notAllowed.end'),
        defaultMessage: 'If you wish to use it, please contact your administrator',
      })}.
    </Typography>
  )

  if (!isActiveContentType || !contentTypeConfig) return (
    <Typography textColor="neutral600">
      {formatMessage({
        id: getTranslation('components.CMEditViewAside.notConfigured.start'),
        defaultMessage: 'This content type is not configured for',
      })}
      {" "}<strong>{PLUGIN_NAME}</strong>.{" "}
      {formatMessage({
        id: getTranslation('components.CMEditViewAside.notConfigured.middle'),
        defaultMessage: 'If you wish to use it, please configure it in the',
      })}
      {" "}<Link href="/admin/settings/webatlas/configuration">
        {formatMessage({
          id: getTranslation('components.CMEditViewAside.notConfigured.end'),
          defaultMessage: 'settings',
        })}
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