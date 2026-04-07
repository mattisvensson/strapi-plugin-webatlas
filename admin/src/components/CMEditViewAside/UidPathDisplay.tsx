import { Field } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

function UidPathDisplay({ path }: { path: string }) {
  const { formatMessage } = useIntl();

  return (
    <Field.Root
      hint={formatMessage({
        id: getTranslation('components.CMEditViewAside.path.uidPath.hint'),
        defaultMessage: 'Permanent UID path, cannot be changed',
      })}
    >
      <Field.Input
        value={path}
        disabled
      />
      <Field.Hint/>
    </Field.Root>
  )
}

export default UidPathDisplay;