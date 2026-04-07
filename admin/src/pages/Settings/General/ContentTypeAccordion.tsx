import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { Box, Accordion, Field } from '@strapi/design-system';
import { getTranslation } from '../../../utils';
import { useIntl } from 'react-intl';
import type { ContentType, ConfigContentType } from '../../../../../types';

export default function ContentTypeAccordion({
  contentType,
  contentTypeSettings,
  dispatch
}: {
  contentType: ContentType | undefined,
  contentTypeSettings: ConfigContentType,
  dispatch: React.Dispatch<any>
}) {

  const { formatMessage } = useIntl();

  if (!contentType) return null

  return (
    <Box
      borderColor={!contentTypeSettings.default ? 'danger500' : undefined}
      key={contentType.uid}
    >
      <Accordion.Item key={contentType.uid} value={contentType.uid}>
        <Accordion.Header>
          <Accordion.Trigger>
            {contentType?.info.displayName}
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>
          <Box padding={3}>
            <Field.Root
              name="selectedContentTypes"
              hint={formatMessage({
                id: getTranslation('settings.page.generate.hint'),
                defaultMessage: 'The selected field from the content type will be used to generate the path. Use a field that is unique and descriptive, such as a "title" or "name".',
              })}
              error={!contentTypeSettings.default && formatMessage({
                id: getTranslation('settings.page.generate.error'),
                defaultMessage: 'Please select a default field',
              })}
              required
            >
              <Field.Label>
                {formatMessage({
                  id: getTranslation('settings.page.generate'),
                  defaultMessage: 'Generate paths from',
                })}
              </Field.Label>
              <SingleSelect
                name={`defaultField-${contentType.uid}`}
                onClear={() => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: contentType.uid, field: '' } })}
                value={contentTypeSettings?.default || ''}
                onChange={(value: string | number) => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: contentType.uid, field: String(value) } })}
              >
                {Object.entries(contentType.attributes).map(([key], index) => {
                  if (
                    key === 'id' ||
                    key === 'documentId' ||
                    key === 'createdAt' ||
                    key === 'updatedAt' ||
                    key === 'createdBy' ||
                    key === 'updatedBy' ||
                    key === 'webatlas_path' ||
                    key === 'webatlas_override' ||
                    key === 'webatlas_parent'
                  ) return null
                  return <SingleSelectOption key={index} value={key}>{key}</SingleSelectOption>
                })}
              </SingleSelect>
              <Field.Hint/>
            </Field.Root>
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Box>

  )
}
