import type { ConfigContentType, Entity } from '../../../../../types'
import {
	Badge,
	Box,
	Button,
	Checkbox,
	Field,
	Flex,
	Grid,
	Loader,
	Searchbar,
	SingleSelect,
	SingleSelectOption,
	Typography,
} from '@strapi/design-system'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../../utils'
import { useEntrySearch } from '../../../hooks'

export type SelectedEntry = {
	entry: Entity
	contentType: ConfigContentType
}

export const getSelectionKey = (contentType: ConfigContentType, entry: Entity) =>
	`${contentType.uid}:${entry.documentId}`

export default function EntrySelection({
	contentTypes,
	contentType,
	setContentType,
	query,
	setQuery,
	selectedEntries,
	onToggle,
	onClear,
	getUsage,
}: {
	contentTypes: ConfigContentType[]
	contentType: ConfigContentType | undefined
	setContentType: (contentType: ConfigContentType) => void
	query: string
	setQuery: (query: string) => void
	selectedEntries: Map<string, SelectedEntry>
	onToggle: (selectedEntry: SelectedEntry) => void
	onClear: () => void
	// Hint for entries that are already used in a navigation, e.g. "already in this navigation"
	getUsage: (entry: Entity) => string | null
}) {
	const { formatMessage } = useIntl()
	const { entries, loading, hasError, hasMore, loadMore } = useEntrySearch(contentType, query)
	const titleField = contentType?.routeSourceField

	return (
		<Flex direction="column" alignItems="stretch" gap={3}>
			<Grid.Root gap={4}>
				<Grid.Item col={6} s={12}>
					<Box width="100%">
						<Field.Root>
							<Field.Label>
								{formatMessage({
									id: getTranslation('modal.internalItem.contentType.label'),
									defaultMessage: 'Content Type',
								})}
							</Field.Label>
							<SingleSelect
								value={contentType?.uid ?? ''}
								placeholder={formatMessage({
									id: getTranslation('modal.internalItem.contentType.placeholder'),
									defaultMessage: 'Select a content type',
								})}
								onChange={(value: string | number) => {
									const nextContentType = contentTypes.find(({ uid }) => uid === value)
									if (nextContentType) setContentType(nextContentType)
								}}
							>
								{contentTypes.map((type) => (
									<SingleSelectOption key={type.uid} value={type.uid}>
										{type.label}
									</SingleSelectOption>
								))}
							</SingleSelect>
						</Field.Root>
					</Box>
				</Grid.Item>
				<Grid.Item col={6} s={12} alignItems="flex-end">
					<Box width="100%">
						<Searchbar
							name="entry-search"
							value={query}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
							onClear={() => setQuery('')}
							// Enter would submit the modal form and leave the selection
							onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && e.preventDefault()}
							clearLabel={formatMessage({
								id: getTranslation('navigation.page.search.clear'),
								defaultMessage: 'Clear search',
							})}
							placeholder={formatMessage({
								id: getTranslation('modal.entrySelection.search'),
								defaultMessage: 'Search entries',
							})}
							disabled={!contentType}
						>
							{formatMessage({
								id: getTranslation('modal.entrySelection.search'),
								defaultMessage: 'Search entries',
							})}
						</Searchbar>
					</Box>
				</Grid.Item>
			</Grid.Root>

			{contentType && (
				<Box
					borderColor="neutral200"
					borderStyle="solid"
					borderWidth="1px"
					hasRadius
					maxHeight="32rem"
					overflow="auto"
				>
					{entries.map((entry) => {
						const selectionKey = getSelectionKey(contentType, entry)
						const usage = getUsage(entry)
						return (
							<Flex
								key={selectionKey}
								tag="label"
								gap={3}
								paddingTop={2}
								paddingBottom={2}
								paddingLeft={3}
								paddingRight={3}
								borderColor="neutral150"
								borderStyle="solid"
								borderWidth="0 0 1px 0"
								cursor="pointer"
							>
								<Checkbox
									checked={selectedEntries.has(selectionKey)}
									onCheckedChange={() => onToggle({ entry, contentType })}
								/>
								<Typography ellipsis>
									{(titleField && entry[titleField]) || `#${entry.id}`}
								</Typography>
								{usage && (
									<Badge marginLeft="auto" flex="none">
										{usage}
									</Badge>
								)}
							</Flex>
						)
					})}

					{loading && (
						<Flex justifyContent="center" padding={3}>
							<Loader small />
						</Flex>
					)}
					{!loading && hasError && (
						<Box padding={3}>
							<Typography textColor="danger600">
								{formatMessage({
									id: getTranslation('modal.entrySelection.error'),
									defaultMessage: 'The entries could not be loaded.',
								})}
							</Typography>
						</Box>
					)}
					{!loading && !hasError && entries.length === 0 && (
						<Box padding={3}>
							<Typography textColor="neutral600">
								{formatMessage({
									id: getTranslation('modal.entrySelection.empty'),
									defaultMessage: 'No entries found',
								})}
							</Typography>
						</Box>
					)}
					{!loading && hasMore && (
						<Flex justifyContent="center" padding={2}>
							<Button variant="tertiary" size="S" type="button" onClick={loadMore}>
								{formatMessage({
									id: getTranslation('modal.entrySelection.loadMore'),
									defaultMessage: 'Load more',
								})}
							</Button>
						</Flex>
					)}
				</Box>
			)}

			<Flex justifyContent="space-between">
				<Typography textColor="neutral600">
					{formatMessage(
						{
							id: getTranslation('modal.entrySelection.selectedCount'),
							defaultMessage: '{count} selected',
						},
						{ count: selectedEntries.size },
					)}
				</Typography>
				{selectedEntries.size > 0 && (
					<Button variant="ghost" size="S" type="button" onClick={onClear}>
						{formatMessage({
							id: getTranslation('modal.entrySelection.clear'),
							defaultMessage: 'Clear selection',
						})}
					</Button>
				)}
			</Flex>
		</Flex>
	)
}
