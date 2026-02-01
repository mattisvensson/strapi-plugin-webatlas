import { Box, Field, SingleSelect, SingleSelectOption } from "@strapi/design-system";
import { RouteStructureProps } from "../../types";
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { useMemo } from "react";
import Tooltip from '../Tooltip'

function RouteStructure({ routeId, routes, selectedParent, setSelectedParent, canonicalPath }: RouteStructureProps) {
  const { formatMessage } = useIntl();

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => a.title.localeCompare(b.title));
  }, [routes]);

  const handleSelectParent = (value: string) => {
    const parentRoute = routes.find(route => route.documentId === value) || null;
    setSelectedParent(parentRoute);
  }

  return (
    <Box paddingBottom={2}>
      <Field.Root>
        <Field.Label>
          {formatMessage({ 
            id: getTranslation('components.CMEditViewAside.path.input.parentSelect.label'), 
            defaultMessage: 'Place under'
          })}
        </Field.Label>
        <SingleSelect 
          value={selectedParent?.documentId || ""}
          onValueChange={handleSelectParent}
        >
          <SingleSelectOption value="">
            {formatMessage({ 
              id: getTranslation('components.CMEditViewAside.path.input.parentSelect.rootPath'), 
              defaultMessage: 'None (root path)'
            })}
          </SingleSelectOption>
          {sortedRoutes.map((route) => {
            if (route.documentId === routeId) return null
            return (
              <SingleSelectOption 
                key={route.documentId}
                value={route.documentId}
              >
                {route.title}
              </SingleSelectOption>
            )
          })}
        </SingleSelect>
      </Field.Root>
      <Field.Root marginTop={4}>
        <Field.Label>
          {formatMessage({
            id: getTranslation('components.CMEditViewAside.canonicalPath.input.label'),
            defaultMessage: 'Canonical Path',
          })}
          <Tooltip description={formatMessage({
            id: getTranslation('components.CMEditViewAside.canonicalPath.input.tooltip'),
            defaultMessage: 'Path that shows how your content is organized, regardless of navigation',
          })} />
        </Field.Label>
        <Field.Input
          id="canonicalPath-input"
          value={canonicalPath}
          disabled
        />
        <Field.Hint/>
      </Field.Root>
    </Box>
  )
}

export default RouteStructure;