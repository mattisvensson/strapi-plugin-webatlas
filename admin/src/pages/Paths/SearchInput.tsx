import { Box, Grid, Field } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

function SearchInput({
  searchQuery,
  handleSearchChange
}: {
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {

  const { formatMessage } = useIntl();

  return (
    <Grid.Root style={{ marginBottom: '16px' }}>
      <Grid.Item col={4} s={12}>
        <Box width="100%">
          <Field.Root>
            <Field.Input
              name="search"
              placeholder={formatMessage({
                id: getTranslation('paths.page.searchPlaceholder'),
                defaultMessage: 'Search paths',
              })}
              value={searchQuery}
              onChange={handleSearchChange}
              endAction={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                    style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Clear search"
                  >
                    <Cross />
                  </button>
                ) : null
              }
            />
          </Field.Root>
        </Box>
      </Grid.Item>
    </Grid.Root>
  );
}

export default SearchInput;