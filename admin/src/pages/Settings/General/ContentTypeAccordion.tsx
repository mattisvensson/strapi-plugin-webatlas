import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import Tooltip from '../../../components/Tooltip'
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
      borderColor={!contentTypeSettings.default && 'danger500'}
      key={contentType.uid}
    >
      <Accordion.Item key={contentType.uid} value={contentType.uid} size="S">
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
                id: getTranslation('settings.page.defaultField.hint'),
                defaultMessage: 'The selected field from the content type will be used to generate the URL alias. Use a field that is unique and descriptive, such as a "title" or "name".',
              })}
              error={!contentTypeSettings.default && formatMessage({
                id: getTranslation('settings.page.defaultField.error'),
                defaultMessage: 'Please select a default field',
              })}
              required
            >
              <Field.Label>
                {formatMessage({
                  id: getTranslation('settings.page.defaultField'),
                  defaultMessage: 'Default URL Alias field',
                })}
              </Field.Label>
              <SingleSelect
                name={`defaultField-${contentType.uid}`}
                onClear={() => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: contentType.uid, field: '' } })}
                value={contentTypeSettings?.default || ''}
                onChange={(value: string) => dispatch({ type: 'SET_DEFAULT_FIELD', payload: { ctUid: contentType.uid, field: value } })}
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
                    key === 'webatlas_override'
                  ) return null
                  return <SingleSelectOption key={index} value={key}>{key}</SingleSelectOption>
                })}
              </SingleSelect>
              <Field.Hint/>
            </Field.Root>
            <Box paddingTop={4}>
              <Field.Root
                name="urlAliasPattern"
                hint={formatMessage({
                  id: getTranslation('settings.page.urlAliasPattern.hint'),
                  defaultMessage: 'The pattern to prepend to the generated URL alias. For example, if you enter "blog" and the value of default field is "My First Post", the generated URL alias will be "blog/my-first-post". Leave empty for no prefix.',
                })}
              >
                <Field.Label>
                  {formatMessage({
                    id: getTranslation('settings.page.urlAliasPattern'),
                    defaultMessage: 'URL Alias Pattern',
                  })}
                  <Tooltip description={formatMessage({
                    id: getTranslation('settings.page.urlAliasPattern.tooltip'),
                    defaultMessage: 'Leading and trailing slashes will be removed. Spaces will be replaced with hyphens. Special characters will be encoded.',
                  })} />
                </Field.Label>
                <Field.Input
                  value={contentTypeSettings.pattern}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_PATTERN', payload: { ctUid: contentType.uid, pattern: e.target.value } })}
                  disabled={!contentTypeSettings.default}
                  type="text"
                  placeholder={formatMessage({
                    id: getTranslation('settings.page.urlAliasPattern.placeholder'),
                    defaultMessage: 'e.g. blog',
                  })}
                />
                <Field.Hint />
              </Field.Root>
            </Box>
          </Box>
        </Accordion.Content>
      </Accordion.Item>
    </Box>
    
  )
}