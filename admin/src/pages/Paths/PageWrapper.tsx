import { Layouts, Page } from '@strapi/strapi/admin'
import { getTranslation } from '../../utils'
import { useIntl } from 'react-intl'

export default function PageWrapper({
	children,
	total,
	matches,
}: {
	children: React.ReactNode
	// Total number of all paths, independent of search and filters. Not shown while loading
	total?: number
	// Number of paths matching search and filters. Only passed while a search or filter is active
	matches?: number
}) {
	const { formatMessage } = useIntl()

	const totalText =
		total === undefined
			? undefined
			: formatMessage(
					{
						id: getTranslation('paths.page.total'),
						defaultMessage: '{count, plural, one {# path} other {# paths}} total',
					},
					{ count: total },
				)
	const matchesText =
		matches === undefined
			? undefined
			: formatMessage(
					{
						id: getTranslation('paths.page.matches'),
						defaultMessage: '{count, plural, one {# match} other {# matches}}',
					},
					{ count: matches },
				)

	return (
		<Page.Main>
			<Layouts.Header
				title={formatMessage({
					id: getTranslation('paths.page.title'),
					defaultMessage: 'Paths',
				})}
				subtitle={[matchesText, totalText].filter(Boolean).join(' · ') || undefined}
			/>
			<Layouts.Content>
				<>{children}</>
			</Layouts.Content>
		</Page.Main>
	)
}
