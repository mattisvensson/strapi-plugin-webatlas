import type { Route } from '../../../../types';
import { Typography, Tr, Td, Flex, LinkButton } from '@strapi/design-system';
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { Pencil } from '@strapi/icons';

export default function TableRow({ route }: { route: Route }) {
  const { formatMessage } = useIntl();
  
  return (
    <Tr>
      <Td>
        <Typography textColor="neutral800">{route.title}</Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">{route.path}</Typography>
      </Td>
      <Td>
        <Typography textColor="neutral800">
          {formatMessage({
            id: getTranslation(`path.type.${route.type}`),
            defaultMessage: '-',
          })}
        </Typography>
      </Td>
      <Td>
        <Flex gap={2} justifyContent="end">
          {route.type === "internal" && 
            <LinkButton
              variant="secondary"
              startIcon={<Pencil />} 
              href={`/admin/content-manager/collection-types/${route.relatedContentType}/${route.relatedDocumentId}`}
            >
              {formatMessage({
                id: getTranslation('edit'),
                defaultMessage: 'Edit',
              })}
            </LinkButton>
          }
        </Flex>
      </Td>
    </Tr>
  )
}