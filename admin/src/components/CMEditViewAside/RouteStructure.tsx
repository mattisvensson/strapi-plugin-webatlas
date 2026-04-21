import { Box, Field, SingleSelect, SingleSelectOption } from "@strapi/design-system";
import { RouteStructureProps } from "../../types";
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { useMemo } from "react";
import Tooltip from '../Tooltip'

function RouteStructure({
  routes,
  selectedParent,
  setSelectedParent,
  canonicalPath,
  prohibitedRouteIds
}: RouteStructureProps) {
  const { formatMessage } = useIntl();

  const filteredRoutes = useMemo(() => {
    return [...routes].sort((a, b) => a.title.localeCompare(b.title))
      .filter((route) => !prohibitedRouteIds?.includes(route.documentId) || route.documentId === selectedParent?.documentId);
  }, [routes, prohibitedRouteIds, selectedParent]);

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
          {filteredRoutes.map((route) => (
            <SingleSelectOption
              key={route.documentId}
              value={route.documentId}
            >
              {route.title}
            </SingleSelectOption>
          ))}
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
            defaultMessage: 'The path determined by your content\'s natural hierarchy, independent of where it appears in navigation menus.',
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
