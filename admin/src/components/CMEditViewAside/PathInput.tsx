import type { ConfigContentType } from '../../../../types';
import type { PanelAction, PanelPathState } from '../../types';
import { Field } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';
import Tooltip from '../Tooltip'
import { transformToUrl } from '../../../../utils';

type PathInputProps = {
  path: PanelPathState;
  dispatchPath: React.Dispatch<PanelAction>;
  isOverride: boolean;
  config: ConfigContentType;
}

function PathInput({ path, dispatchPath, isOverride, config }: PathInputProps) {
  const { formatMessage } = useIntl();

  const displayedPath = isOverride && path.overridePath !== undefined
    ? path.overridePath
    : path.value ?? "";

  const inputBorder = path.replacement === null
    ? ""
    : path.replacement
      ? "1px solid #ee5e52"
      : "1px solid #5cb176";

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
        value={displayedPath}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'SET_OVERRIDEPATH', payload: e.target.value })}
        disabled={!isOverride}
        onBlur={(e: React.ChangeEvent<HTMLInputElement>) => dispatchPath({ type: 'SET_OVERRIDEPATH', payload: transformToUrl(e.target.value, false) })}

        style={{ outline: inputBorder }}
      />
      <Field.Hint/>
    </Field.Root>
  )
}

export default PathInput;
