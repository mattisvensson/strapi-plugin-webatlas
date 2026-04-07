import { Checkbox, Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

type OverrideCheckboxProps = {
  isOverride: boolean;
  setIsOverride: (value: boolean) => void;
  disabledCondition?: boolean;
}

function OverrideCheckbox({ isOverride, setIsOverride, disabledCondition }: OverrideCheckboxProps) {
  const { formatMessage } = useIntl();
  return (
    <Flex
      gap={2}
      paddingTop={2}
    >
      <Checkbox
        id="path-override-checkbox"
        checked={isOverride}
        onCheckedChange={() => setIsOverride(!isOverride)}
        disabled={disabledCondition}
      >
        <Typography textColor="neutral600">
          {formatMessage({
            id: getTranslation('components.CMEditViewAside.path.overrideCheckbox'),
            defaultMessage: 'Override automatic path generation',
          })}
        </Typography>
      </Checkbox>
    </Flex>
  )
}

export default OverrideCheckbox;