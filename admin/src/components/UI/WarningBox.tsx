import { Badge, Flex, Typography } from '@strapi/design-system'
import { WarningCircle } from '@strapi/icons'

export default function WarningBox({
	title,
	description,
}: {
	title: string
	description?: string
}) {
	return (
		<Badge variant="warning" minWidth="100%">
			<Flex direction="column" alignItems="center" gap={2}>
				<Flex alignItems="center" gap={2}>
					<WarningCircle />
					<Typography>{title}</Typography>
				</Flex>
				{description && <Typography variant="sigma">{description}</Typography>}
			</Flex>
		</Badge>
	)
}
