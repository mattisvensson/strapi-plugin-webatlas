import type { HealthCheck, HealthIssue, HealthSeverity } from '../../../../types'
import type { IntlShape } from 'react-intl'
import { getTranslation } from '../../utils'

// Order of the checks in the summary: errors first
export const HEALTH_CHECKS: HealthCheck[] = [
	'pathConflict',
	'orphanedRoute',
	'blacklistedPath',
	'invalidExternalUrl',
	'unpublishedInNavigation',
	'tooDeepItem',
	'notInNavigation',
	'emptyWrapper',
]

export const SEVERITY_COLORS: Record<
	HealthSeverity,
	{ backgroundColor: string; textColor: string; borderColor: string }
> = {
	error: { backgroundColor: 'danger100', textColor: 'danger600', borderColor: 'danger200' },
	warning: { backgroundColor: 'warning100', textColor: 'warning600', borderColor: 'warning200' },
	info: { backgroundColor: 'neutral100', textColor: 'neutral600', borderColor: 'neutral200' },
}

const CHECK_LABELS: Record<HealthCheck, string> = {
	pathConflict: 'Path conflict',
	orphanedRoute: 'Orphaned',
	blacklistedPath: 'Blocked path',
	invalidExternalUrl: 'Invalid URL',
	unpublishedInNavigation: 'Unpublished',
	tooDeepItem: 'Too deep',
	notInNavigation: 'Not in navigation',
	emptyWrapper: 'Empty wrapper',
}

const CHECK_DESCRIPTIONS: Record<HealthCheck, string> = {
	pathConflict: 'Several entries use the same path. The frontend then delivers any one of them.',
	orphanedRoute:
		'The linked entry or content type no longer exists or is disabled in the plugin settings.',
	blacklistedPath:
		'The path is blocked by the route blacklist. It only applies to new paths, existing ones stay reachable.',
	invalidExternalUrl: 'The external link is no valid URL (http, https, mailto or tel).',
	unpublishedInNavigation:
		'The entry is not published, so it is missing in the navigation of the frontend.',
	tooDeepItem: 'The navigation item is deeper than the maximum depth of its navigation allows.',
	notInNavigation: 'The page is not linked in any navigation.',
	emptyWrapper: 'The wrapper has no children and shows as an empty item in the navigation.',
}

export const getCheckLabel = (check: HealthCheck, { formatMessage }: IntlShape) =>
	formatMessage({
		id: getTranslation(`paths.page.health.check.${check}`),
		defaultMessage: CHECK_LABELS[check],
	})

export const getCheckDescription = (check: HealthCheck, { formatMessage }: IntlShape) =>
	formatMessage({
		id: getTranslation(`paths.page.health.check.${check}.description`),
		defaultMessage: CHECK_DESCRIPTIONS[check],
	})

// Explains a single issue of a route, with the details of the check
export function getIssueMessage({ check, details = {} }: HealthIssue, intl: IntlShape) {
	const { formatMessage } = intl

	switch (check) {
		case 'pathConflict':
			return formatMessage(
				{
					id: getTranslation('paths.page.health.issue.pathConflict'),
					defaultMessage: '"{value}" is also used by: {routes}',
				},
				{
					value: details.value,
					routes: details.conflictingRoutes?.map((route) => route.title).join(', '),
				},
			)
		case 'orphanedRoute':
			return formatMessage({
				id: getTranslation(`paths.page.health.issue.orphanedRoute.${details.reason}`),
				defaultMessage: CHECK_DESCRIPTIONS.orphanedRoute,
			})
		case 'blacklistedPath':
			return formatMessage(
				{
					id: getTranslation('paths.page.health.issue.blacklistedPath'),
					defaultMessage: '"{value}" is blocked by the route blacklist',
				},
				{ value: details.value },
			)
		case 'invalidExternalUrl':
			return formatMessage(
				{
					id: getTranslation('paths.page.health.issue.invalidExternalUrl'),
					defaultMessage: '"{value}" is no valid URL',
				},
				{ value: details.value },
			)
		case 'unpublishedInNavigation':
			return formatMessage(
				{
					id: getTranslation('paths.page.health.issue.unpublishedInNavigation'),
					defaultMessage: 'Not published, but used in the navigation "{navigation}"',
				},
				{ navigation: details.navigationName },
			)
		case 'tooDeepItem':
			// The depth is an index, 0 is the root level
			return formatMessage(
				{
					id: getTranslation('paths.page.health.issue.tooDeepItem'),
					defaultMessage:
						'On level {depth} in "{navigation}", {maxDepth, plural, one {# level is} other {# levels are}} allowed',
				},
				{
					navigation: details.navigationName,
					depth: (details.depth ?? 0) + 1,
					maxDepth: (details.maxDepth ?? 0) + 1,
				},
			)
		case 'emptyWrapper':
			return formatMessage(
				{
					id: getTranslation('paths.page.health.issue.emptyWrapper'),
					defaultMessage: 'Without children in the navigation "{navigation}"',
				},
				{ navigation: details.navigationName },
			)
		default:
			return getCheckDescription(check, intl)
	}
}
