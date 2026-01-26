import type { ConfigContentType, Route } from '../../../../types';
import type { PanelAction, PanelPathState } from '../../types';
import { Field, Tooltip } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

type PathInputProps = {
  parent?: Route;
  path: PanelPathState;
  dispatchPath: React.Dispatch<PanelAction>;
  isOverride: boolean;
  urlIsValid: 'valid' | 'invalid' | null;
  config: ConfigContentType;
}

function PathInput({ parent, path, dispatchPath, isOverride, urlIsValid, config }: PathInputProps) {
  const { formatMessage } = useIntl();

  return (
    <Field.Root
      hint={
        config.default ?
          formatMessage({
            id: getTranslation('components.CMEditViewAside.path.input.start'),
            defaultMessage: 'Edit the',
          })
          + " \"" + config.default + "\" " +
          formatMessage({
            id: getTranslation('components.CMEditViewAside.path.input.end'),
            defaultMessage: 'field to generate a path',
          })
          :
          formatMessage({
            id: getTranslation('components.CMEditViewAside.path.input.noSourceField'),
            defaultMessage: 'Use the override option to set a custom path',
          })
      }
    >
      <Field.Label>
        {formatMessage({
          id: getTranslation('components.CMEditViewAside.path.input.label'),
          defaultMessage: 'Path',
        })}
        <Tooltip description={formatMessage({
          id: getTranslation('components.CMEditViewAside.path.input.tooltip'),
          defaultMessage: 'The following characters are valid: A-Z, a-z, 0-9, /, -, _, $, ., +, !, *, \', (, )',
        })} />
      </Field.Label>
      <Field.Input
        id="path-input"
        value={parent ? `${parent.path}/${path.value}` : path.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'NO_TRANSFORM_AND_CHECK', payload: e.target.value })}
        disabled={!isOverride}
        onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.value === path.prevValue) return
          dispatchPath({ type: 'DEFAULT', payload: e.target.value })}
        }
        style={{ outline: urlIsValid !== null ? (urlIsValid === 'valid' ? "1px solid #5cb176" : "1px solid #ee5e52") : undefined }}
      />
      <Field.Hint/>
    </Field.Root>
  )
}

export default PathInput;