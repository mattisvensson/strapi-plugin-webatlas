import { Box, Field, SingleSelect, SingleSelectOption } from "@strapi/design-system";
import { RouteStructureProps } from "../../types";
import { duplicateCheck, getTranslation, debounce } from '../../utils';
import { useIntl } from 'react-intl';
import { useCallback, useEffect, useMemo, useState } from "react";
import Tooltip from '../Tooltip'
import { useFetchClient } from "@strapi/strapi/admin";
import { transformToUrl } from "../../../../utils";

function RouteStructure({ routeId, routes, selectedParent, setSelectedParent, slug }: RouteStructureProps) {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const [canonicalPath, setCanonicalPath] = useState('');

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => a.title.localeCompare(b.title));
  }, [routes]);

  const parent = useMemo(() => {
    return routes.find(route => route.documentId === selectedParent);
  }, [routes, selectedParent]);

  async function checkPath() {
    if (!slug) return;

    const path = `${parent?.canonicalPath || ''}/${transformToUrl(slug)}`;
    const result = await duplicateCheck(get, path, routeId, true);

    setCanonicalPath(result);
    return result;
  }

  const debouncedCheckUrl = useCallback(debounce(checkPath, 250), [parent, slug]);

  useEffect(() => {
    debouncedCheckUrl()
  }, [parent, slug])

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