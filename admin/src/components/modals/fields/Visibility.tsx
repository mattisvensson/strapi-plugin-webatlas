import { Field, Toggle } from '@strapi/design-system';
import Tooltip from '../../Tooltip';
import { getTranslation } from '../../../utils';
import { useIntl } from 'react-intl';


export default function Visibility({ navItemState, dispatchItemState }: { navItemState: any, dispatchItemState: React.Dispatch<any> }) {

  const { formatMessage } = useIntl();

  return (
    <Field.Root>
      <Field.Label>
        {formatMessage({
          id: getTranslation('modal.item.visibility.label'),
          defaultMessage: 'Visibility',
        })}
        <Tooltip description={formatMessage({
          id: getTranslation('modal.item.visibility.tooltip'),
          defaultMessage: "If set to 'Hidden', this menu item will not show on your site",
        })} />
      </Field.Label>
      <Toggle
        onLabel={formatMessage({
          id: getTranslation('visible'),
          defaultMessage: "Visible",
        })}
        offLabel={formatMessage({
          id: getTranslation('hidden'),
          defaultMessage: "Hidden",
        })}
        checked={navItemState.visible}
        onClick={(e: React.ChangeEvent<HTMLInputElement>) => dispatchItemState({ type: 'SET_VISIBILITY', payload: e.target.checked })}
      />
      <Field.Hint/>
    </Field.Root>
  )
}