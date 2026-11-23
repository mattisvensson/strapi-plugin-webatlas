import type { HealthCheck, HealthIssue } from '../../../../types'
import { Badge, Flex } from '@strapi/design-system'
import { useIntl } from 'react-intl'
import Tooltip from '../../components/Tooltip'
import { HEALTH_CHECKS, SEVERITY_COLORS, getCheckLabel, getIssueMessage } from './healthMessages'

// One badge per check, the tooltip lists the details of all issues of that check
export default function IssueBadges({ issues }: { issues: HealthIssue[] }) {
	const intl = useIntl()

	const issuesByCheck = new Map<HealthCheck, HealthIssue[]>()
	for (const issue of issues) {
		issuesByCheck.set(issue.check, [...(issuesByCheck.get(issue.check) ?? []), issue])
	}

	return (
		<Flex gap={2} wrap="wrap">
			{HEALTH_CHECKS.filter((check) => issuesByCheck.has(check)).map((check) => {
				const checkIssues = issuesByCheck.get(check)!
				return (
					<Flex key={check} gap={1}>
						<Badge {...SEVERITY_COLORS[checkIssues[0].severity]}>
							{getCheckLabel(check, intl)}
						</Badge>
						<Tooltip
							description={[
								...new Set(checkIssues.map((issue) => getIssueMessage(issue, intl))),
							].join('; ')}
						/>
					</Flex>
				)
			})}
		</Flex>
	)
}
