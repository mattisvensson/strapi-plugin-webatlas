import type { RouteFilterKey } from '../../types'
import {
	Box,
	Button,
	MultiSelect,
	MultiSelectOption,
	SingleSelect,
	SingleSelectOption,
} from '@strapi/design-system'
import { useIntl } from 'react-intl'
import { ArrowClockwise } from '@strapi/icons'
import { getTranslation } from '../../utils'

const ROUTE_TYPES = ['internal', 'external', 'wrapper'] as const
const FILTER_WIDTH = '200px'

export default function PathFilters({
	contentTypeOptions,
	selectedContentTypes,
	type,
	deviation,
	navigation,
	handleFilterChange,
	handleResetFilters,
}: {
	contentTypeOptions: { uid: string; label: string }[]
	selectedContentTypes: string[]
	type: string | null
	deviation: string | null
	navigation: string | null
	handleFilterChange: (key: RouteFilterKey, values: string[]) => void
	handleResetFilters: () => void
}) {
	const { formatMessage } = useIntl()
	const hasActiveFilters = selectedContentTypes.length > 0 || !!type || !!deviation || !!navigation

	const clearLabel = formatMessage({
		id: getTranslation('paths.page.filter.clear'),
		defaultMessage: 'Clear filter',
	})
	const contentTypePlaceholder = formatMessage({
		id: getTranslation('paths.page.filter.contentType'),
		defaultMessage: 'Content Type',
	})
	const typePlaceholder = formatMessage({
		id: getTranslation('paths.page.filter.type'),
		defaultMessage: 'Type',
	})
	const deviationPlaceholder = formatMessage({
		id: getTranslation('paths.page.filter.deviation.placeholder'),
		defaultMessage: 'Deviation',
	})
	const navigationPlaceholder = formatMessage({
		id: getTranslation('paths.page.filter.navigation.placeholder'),
		defaultMessage: 'Navigation',
	})

	return (
		<>
			<Box width={FILTER_WIDTH}>
				<MultiSelect
					aria-label={contentTypePlaceholder}
					placeholder={contentTypePlaceholder}
					value={selectedContentTypes}
					onChange={(values: string[]) => handleFilterChange('contentType', values)}
					onClear={() => handleFilterChange('contentType', [])}
					clearLabel={clearLabel}
					customizeContent={(values?: string[]) =>
						values?.length === 1
							? (contentTypeOptions.find((option) => option.uid === values[0])?.label ?? values[0])
							: `${contentTypePlaceholder} (${values?.length ?? 0})`
					}
				>
					{contentTypeOptions.map((option) => (
						<MultiSelectOption key={option.uid} value={option.uid}>
							{option.label}
						</MultiSelectOption>
					))}
				</MultiSelect>
			</Box>
			<Box width={FILTER_WIDTH}>
				<SingleSelect
					aria-label={typePlaceholder}
					placeholder={typePlaceholder}
					value={type ?? ''}
					onChange={(value: string | number) => handleFilterChange('type', [String(value)])}
					onClear={() => handleFilterChange('type', [])}
					clearLabel={clearLabel}
				>
					{ROUTE_TYPES.map((routeType) => (
						<SingleSelectOption key={routeType} value={routeType}>
							{formatMessage({
								id: getTranslation(`path.type.${routeType}`),
								defaultMessage: routeType,
							})}
						</SingleSelectOption>
					))}
				</SingleSelect>
			</Box>
			<Box width={FILTER_WIDTH}>
				<SingleSelect
					aria-label={deviationPlaceholder}
					placeholder={deviationPlaceholder}
					value={deviation ?? ''}
					onChange={(value: string | number) => handleFilterChange('deviation', [String(value)])}
					onClear={() => handleFilterChange('deviation', [])}
					clearLabel={clearLabel}
				>
					<SingleSelectOption value="true">
						{formatMessage({
							id: getTranslation('paths.page.filter.deviation.true'),
							defaultMessage: 'Differs',
						})}
					</SingleSelectOption>
					<SingleSelectOption value="false">
						{formatMessage({
							id: getTranslation('paths.page.filter.deviation.false'),
							defaultMessage: 'Matches',
						})}
					</SingleSelectOption>
				</SingleSelect>
			</Box>
			<Box width={FILTER_WIDTH}>
				<SingleSelect
					aria-label={navigationPlaceholder}
					placeholder={navigationPlaceholder}
					value={navigation ?? ''}
					onChange={(value: string | number) => handleFilterChange('navigation', [String(value)])}
					onClear={() => handleFilterChange('navigation', [])}
					clearLabel={clearLabel}
				>
					<SingleSelectOption value="true">
						{formatMessage({
							id: getTranslation('paths.page.filter.navigation.true'),
							defaultMessage: 'In navigation',
						})}
					</SingleSelectOption>
					<SingleSelectOption value="false">
						{formatMessage({
							id: getTranslation('paths.page.filter.navigation.false'),
							defaultMessage: 'Not in navigation',
						})}
					</SingleSelectOption>
				</SingleSelect>
			</Box>
			{hasActiveFilters && (
				<Button
					variant="tertiary"
					size="L"
					startIcon={<ArrowClockwise />}
					onClick={handleResetFilters}
				>
					{formatMessage({
						id: getTranslation('paths.page.filter.reset'),
						defaultMessage: 'Reset filters',
					})}
				</Button>
			)}
		</>
	)
}
