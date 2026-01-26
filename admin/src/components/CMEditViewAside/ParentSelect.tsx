import { Box, Field, SingleSelect, SingleSelectOption } from "@strapi/design-system";
import { ParentSelectProps } from "../../types";
import { getTranslation } from '../../utils';
import { useIntl } from 'react-intl';
import { useEffect, useState } from "react";

function ParentSelect({ routeId, routes, selectedParent, setSelectedParent }: ParentSelectProps) {
  const { formatMessage } = useIntl();

  const [sortedRoutes, setSortedRoutes] = useState(routes);

  useEffect(() => {
    const sorted = [...routes].sort((a, b) => a.title.localeCompare(b.title));
    setSortedRoutes(sorted);
  }, [routes]);

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
          value={selectedParent}
          onValueChange={setSelectedParent}
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
    </Box>
  )
}

export default ParentSelect;