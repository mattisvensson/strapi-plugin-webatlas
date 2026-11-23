import type { HealthCheck, HealthReport, HealthSeverity } from '../../../../types'
import { Badge, Box, Button, Flex, Loader, Typography } from '@strapi/design-system'
import { ArrowClockwise, CheckCircle, ChevronDown, ChevronUp, WarningCircle } from '@strapi/icons'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../utils'
import {
	HEALTH_CHECKS,
	SEVERITY_COLORS,
	getCheckDescription,
	getCheckLabel,
} from './healthMessages'

const SEVERITIES: HealthSeverity[] = ['error', 'warning', 'info']

export default function HealthSummary({
	report,
	loading,
	activeCheck,
	handleSelectCheck,
	handleRecheck,
}: {
	report: HealthReport | null
	loading: boolean
	activeCheck: string | null
	handleSelectCheck: (check: HealthCheck | null) => void
	handleRecheck: () => void
}) {
	const intl = useIntl()
	const { formatMessage } = intl
	const [expanded, setExpanded] = useState(false)

	// Counted per affected route, a route with several issues of one check counts once
	const routesByCheck = new Map<HealthCheck, Set<string>>()
	for (const issue of report?.issues ?? []) {
		const routes = routesByCheck.get(issue.check) ?? new Set()
		routes.add(issue.routeDocumentId)
		routesByCheck.set(issue.check, routes)
	}
	const checks = HEALTH_CHECKS.filter((check) => routesByCheck.has(check))
	const severityOf = (check: HealthCheck) =>
		report!.issues.find((issue) => issue.check === check)!.severity
	const countBySeverity = (severity: HealthSeverity) =>
		checks
			.filter((check) => severityOf(check) === severity)
			.reduce((sum, check) => sum + routesByCheck.get(check)!.size, 0)

	const summaryText = SEVERITIES.map((severity) => ({ severity, count: countBySeverity(severity) }))
		.filter(({ count }) => count > 0)
		.map(({ severity, count }) =>
			formatMessage(
				{
					id: getTranslation(`paths.page.health.summary.${severity}`),
					defaultMessage: {
						error: '{count, plural, one {# error} other {# errors}}',
						warning: '{count, plural, one {# warning} other {# warnings}}',
						info: '{count, plural, one {# hint} other {# hints}}',
					}[severity],
				},
				{ count },
			),
		)
		.join(' · ')

	const hasErrors = checks.some((check) => severityOf(check) === 'error')

	return (
		<Box
			marginBottom={4}
			padding={4}
			background="neutral0"
			hasRadius
			shadow="tableShadow"
			borderColor={hasErrors ? 'danger200' : undefined}
			borderStyle={hasErrors ? 'solid' : undefined}
			borderWidth={hasErrors ? '1px' : undefined}
		>
			<Flex justifyContent="space-between" gap={4}>
				<Flex gap={2}>
					{loading ? (
						<>
							<Loader small />
							<Typography>
								{formatMessage({
									id: getTranslation('paths.page.health.loading'),
									defaultMessage: 'Checking paths …',
								})}
							</Typography>
						</>
					) : !report ? (
						<Typography textColor="neutral600">
							{formatMessage({
								id: getTranslation('paths.page.health.unavailable'),
								defaultMessage: 'The paths could not be checked',
							})}
						</Typography>
					) : checks.length === 0 ? (
						<>
							<CheckCircle fill="success600" />
							<Typography>
								{formatMessage({
									id: getTranslation('paths.page.health.noIssues'),
									defaultMessage: 'No issues found',
								})}
							</Typography>
						</>
					) : (
						<>
							<WarningCircle fill={hasErrors ? 'danger600' : 'warning600'} />
							<Typography fontWeight="bold">{summaryText}</Typography>
						</>
					)}
				</Flex>
				<Flex gap={2}>
					{!loading && checks.length > 0 && (
						<Button
							variant="tertiary"
							endIcon={expanded ? <ChevronUp /> : <ChevronDown />}
							onClick={() => setExpanded((current) => !current)}
						>
							{expanded
								? formatMessage({
										id: getTranslation('paths.page.health.hideDetails'),
										defaultMessage: 'Hide details',
									})
								: formatMessage({
										id: getTranslation('paths.page.health.showDetails'),
										defaultMessage: 'Show details',
									})}
						</Button>
					)}
					<Button
						variant="tertiary"
						startIcon={<ArrowClockwise />}
						onClick={handleRecheck}
						disabled={loading}
					>
						{formatMessage({
							id: getTranslation('paths.page.health.recheck'),
							defaultMessage: 'Check again',
						})}
					</Button>
				</Flex>
			</Flex>
			{expanded && !loading && checks.length > 0 && (
				<Flex direction="column" alignItems="stretch" gap={2} marginTop={4}>
					{checks.map((check) => {
						const isActive = activeCheck === check
						return (
							<Flex
								key={check}
								gap={4}
								justifyContent="space-between"
								padding={3}
								hasRadius
								background={isActive ? 'primary100' : 'neutral100'}
							>
								<Flex direction="column" alignItems="flex-start" gap={1}>
									<Flex gap={2}>
										<Badge {...SEVERITY_COLORS[severityOf(check)]}>
											{getCheckLabel(check, intl)}
										</Badge>
										<Typography variant="omega" textColor="neutral600">
											{formatMessage(
												{
													id: getTranslation('paths.page.health.affected'),
													defaultMessage: '{count, plural, one {# path} other {# paths}}',
												},
												{ count: routesByCheck.get(check)!.size },
											)}
										</Typography>
									</Flex>
									<Typography variant="pi" textColor="neutral600">
										{getCheckDescription(check, intl)}
									</Typography>
								</Flex>
								<Button
									variant={isActive ? 'secondary' : 'tertiary'}
									onClick={() => handleSelectCheck(isActive ? null : check)}
								>
									{isActive
										? formatMessage({
												id: getTranslation('paths.page.health.hidePaths'),
												defaultMessage: 'Show all paths',
											})
										: formatMessage({
												id: getTranslation('paths.page.health.showPaths'),
												defaultMessage: 'Show paths',
											})}
								</Button>
							</Flex>
						)
					})}
				</Flex>
			)}
		</Box>
	)
}
