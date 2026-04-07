import { Box } from '@strapi/design-system';
import { ReactElement } from 'react';
import { Link as LinkIcon, ExternalLink, OneToMany } from '@strapi/icons';

export default function RouteItemIcon ({ type, color = 'neutral800' }: { type: 'internal' | 'external' | 'wrapper' | undefined, color?: string }): ReactElement {
  switch (type) {
    case "external":
      return <ExternalLink color={color}/>
    case "wrapper":
      return <OneToMany color={color}/>
    case "internal":
      return <LinkIcon color={color}/>
    default:
      return <Box width="16px" height="16px"/>
  }
}
