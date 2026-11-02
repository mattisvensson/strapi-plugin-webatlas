/*
 *
 * Settings
 * This file contains the navigation settings page for the Webatlas plugin.
 * It allows users to set the max depth of every navigation.
 *
 */

import { useEffect, useMemo, useState } from 'react'
import { Field, RawTable, Tbody, Td, Th, Thead, Tr, Typography } from '@strapi/design-system'
import { useNotification, Page, useRBAC } from '@strapi/strapi/admin'
import useApi from '../../../hooks/useApi'
import useErrorMessage from '../../../hooks/useErrorMessage'
import type { NavigationDepth } from '../../../../../types'
import { getTranslation, isAbortError } from '../../../utils'
import { useIntl } from 'react-intl'
import { FullLoader } from '../../../components/UI'
import { PageWrapper, ContentBox } from '../'
import pluginPermissions from '../../../permissions'

// The inputs show levels (1 = root only), the navigations store the depth index (0 = root only)
const toLevels = (maxDepth: number) => String(maxDepth + 1)

const Settings = () => {
	const { getNavigationDepths, updateNavigationDepths } = useApi()
	const { toggleNotification } = useNotification()
	const getErrorMessage = useErrorMessage()
	const { formatMessage } = useIntl()
	const [depths, setDepths] = useState<NavigationDepth[]>([])
	const [levels, setLevels] = useState<Record<string, string>>({})
	const [loading, setLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const {
		isLoading: isLoadingPermissions,
		allowedActions: { canUpdate },
	} = useRBAC(pluginPermissions['settings.navigation.update'])

	const applyDepths = (nextDepths: NavigationDepth[]) => {
		setDepths(nextDepths)
		setLevels(
			Object.fromEntries(nextDepths.map((depth) => [depth.documentId, toLevels(depth.maxDepth)])),
		)
	}

	const showError = (error: unknown) =>
		toggleNotification({
			type: 'danger',
			message: getErrorMessage(
				error,
				formatMessage({
					id: getTranslation('notification.error'),
					defaultMessage: 'An error occurred',
				}),
			),
		})

	useEffect(() => {
		getNavigationDepths()
			.then(applyDepths)
			.catch((error) => {
				if (isAbortError(error)) return
				console.error(error)
				showError(error)
			})
			.finally(() => setLoading(false))
	}, [])

	// Validation error per navigation, the depth cannot be lower than the deepest existing item
	const errors = useMemo(() => {
		const result: Record<string, string> = {}
		depths.forEach(({ documentId, deepestDepth }) => {
			const value = Number(levels[documentId])
			const minLevels = Math.max(1, deepestDepth + 1)

			if (!Number.isInteger(value) || value < 1) {
				result[documentId] = formatMessage({
					id: getTranslation('settings.page.navigation.maxDepth.invalid'),
					defaultMessage: 'At least 1',
				})
			} else if (value < minLevels) {
				result[documentId] = formatMessage(
					{
						id: getTranslation('settings.page.navigation.maxDepth.tooLow'),
						defaultMessage: 'At least {count}, the navigation already has items on level {count}',
					},
					{ count: minLevels },
				)
			}
		})
		return result
	}, [depths, levels, formatMessage])

	const changedDepths = depths
		.filter(({ documentId, maxDepth }) => levels[documentId] !== toLevels(maxDepth))
		.map(({ documentId }) => ({ documentId, maxDepth: Number(levels[documentId]) - 1 }))

	async function save() {
		setIsSaving(true)
		try {
			applyDepths(await updateNavigationDepths(changedDepths))

			toggleNotification({
				type: 'success',
				message: formatMessage({
					id: getTranslation('notification.settings.saved'),
					defaultMessage: 'Settings saved successfully',
				}),
			})
		} catch (error) {
			console.error(error)
			showError(error)
		} finally {
			setIsSaving(false)
		}
	}

	if (loading || isLoadingPermissions) {
		return (
			<PageWrapper
				isSaving={isSaving}
				subtitle={formatMessage({
					id: getTranslation('loading'),
					defaultMessage: 'Loading...',
				})}
				disabledCondition={true}
			>
				<FullLoader height={200} />
			</PageWrapper>
		)
	}

	return (
		<Page.Protect permissions={pluginPermissions['settings.navigation.read']}>
			<PageWrapper
				// Without the permission to update, the settings are only shown
				save={canUpdate ? save : undefined}
				isSaving={isSaving}
				subtitle={formatMessage({
					id: getTranslation('settings.page.navigation.subtitle'),
					defaultMessage: 'Configure navigation settings',
				})}
				disabledCondition={changedDepths.length === 0 || Object.keys(errors).length > 0}
			>
				<ContentBox
					title={formatMessage({
						id: getTranslation('settings.page.navigation.maxDepth.title'),
						defaultMessage: 'Maximum depth',
					})}
				>
					<Typography textColor="neutral600" tag="p">
						{formatMessage({
							id: getTranslation('settings.page.navigation.maxDepth.description'),
							defaultMessage:
								'Sets how many levels a navigation may have. It cannot be lower than the deepest existing level.',
						})}
					</Typography>
					{depths.length === 0 ? (
						<Typography textColor="neutral600" tag="p">
							{formatMessage({
								id: getTranslation('settings.page.navigation.maxDepth.empty'),
								defaultMessage: 'There are no navigations yet.',
							})}
						</Typography>
					) : (
						<RawTable colCount={3} rowCount={depths.length + 1} style={{ width: '100%' }}>
							<Thead>
								<Tr>
									<Th>
										<Typography variant="sigma">
											{formatMessage({
												id: getTranslation('settings.page.navigation.navigation'),
												defaultMessage: 'Navigation',
											})}
										</Typography>
									</Th>
									<Th>
										<Typography variant="sigma">
											{formatMessage({
												id: getTranslation('settings.page.navigation.maxDepth.levels'),
												defaultMessage: 'Maximum levels',
											})}
										</Typography>
									</Th>
									<Th>
										<Typography variant="sigma">
											{formatMessage({
												id: getTranslation('settings.page.navigation.maxDepth.deepest'),
												defaultMessage: 'Current deepest level',
											})}
										</Typography>
									</Th>
								</Tr>
							</Thead>
							<Tbody>
								{depths.map(({ documentId, name, deepestDepth }) => (
									<Tr key={documentId}>
										<Td>
											<Typography fontWeight="bold">{name}</Typography>
										</Td>
										<Td>
											<Field.Root error={errors[documentId]}>
												<Field.Input
													type="number"
													min={1}
													step={1}
													aria-label={formatMessage({
														id: getTranslation('settings.page.navigation.maxDepth.levels'),
														defaultMessage: 'Maximum levels',
													})}
													value={levels[documentId] ?? ''}
													disabled={!canUpdate}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
														setLevels((current) => ({ ...current, [documentId]: e.target.value }))
													}
												/>
												<Field.Error />
											</Field.Root>
										</Td>
										<Td>
											<Typography textColor="neutral600">
												{deepestDepth < 0 ? '–' : deepestDepth + 1}
											</Typography>
										</Td>
									</Tr>
								))}
							</Tbody>
						</RawTable>
					)}
				</ContentBox>
			</PageWrapper>
		</Page.Protect>
	)
}

export default Settings
