import type { ConfigContentType } from '../../../../types';
import { useState, useEffect } from 'react';
import { useRBAC } from '@strapi/strapi/admin';
import type { PanelComponent, PanelComponentProps } from '@strapi/content-manager/strapi-admin';
import { Typography } from '@strapi/design-system';
import { usePluginConfig, useAllContentTypes } from '../../hooks';
import Alias from './Alias';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import pluginPermissions from '../../permissions';
import { PLUGIN_NAME } from '../../../../utils';

const CMEditViewAside: PanelComponent = ({
  // activeTab,
  // collectionType,
  // document,
  documentId,
  // meta,
  model,
}: PanelComponentProps) => {
  const { contentTypes } = useAllContentTypes()
  const { config } = usePluginConfig()
  const { formatMessage } = useIntl();

  const [isAllowedContentType, setIsAllowedContentType] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contentTypeConfig, setContentTypeConfig] = useState<ConfigContentType | null>(null);
  const [isActiveContentType, setIsActiveContentType] = useState(false);

  const panelTitle = PLUGIN_NAME;

  // Check if content type is allowed - moved to useEffect to prevent infinite re-renders
  useEffect(() => {
    const contentType = contentTypes?.find((ct) => ct.uid === model);
    setIsAllowedContentType(!!contentType?.pluginOptions?.webatlas?.enabled);
  }, [contentTypes, model]);

  useEffect(() => {
    const isWebatlasLabel = (label: Element) => label.textContent?.startsWith('webatlas_');
    
    const cleanupLabels = () => {
      const labels = document.querySelectorAll('label');
      
      labels.forEach((label: Element) => {
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
    };

    // Delay execution to ensure DOM is populated by Strapi's form system
    const timeoutId = setTimeout(() => {
      cleanupLabels();
      
      // Also try again after a longer delay in case form takes time to render
      const secondTimeoutId = setTimeout(cleanupLabels, 1000);
      
      // Cleanup function will clear this timeout if component unmounts
      return () => clearTimeout(secondTimeoutId);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [documentId, model]);

  
  useEffect(() => {
    if (!config) return;
        
    // Reset state first
    setIsActiveContentType(false);
    setContentTypeConfig(null);
    
    config?.selectedContentTypes?.forEach((type) => {
      if (type.uid === model) {
        setIsActiveContentType(true);
        setContentTypeConfig(type);
      }
    });
    setIsLoading(false);
  }, [config, model])

  const {
    allowedActions: { canAside },
  } = useRBAC({
    cmAside: pluginPermissions['cm.aside'],
  });

  if (!canAside || !isAllowedContentType || !isActiveContentType || !contentTypeConfig) return null

  if (!config) {
    console.error('CMEditViewAside: Plugin is not configured.');
    return null
  }

  if (isLoading) return {
    title: panelTitle,
    content: (
      <Typography textColor="neutral600">
        {formatMessage({
          id: getTranslation('loading'),
          defaultMessage: 'Loading...',
        })}
      </Typography>
    )
  }

  return {
    title: panelTitle,
    content: <Alias config={contentTypeConfig} />,
  };
};

export default CMEditViewAside;