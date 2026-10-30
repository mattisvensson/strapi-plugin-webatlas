import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { Button, Dialog } from '@strapi/design-system'
import { WarningCircle } from '@strapi/icons'

/**
 * Asks for confirmation before leaving the page with unsaved changes, like the forms of the content
 * manager. Uses the translations of the Strapi admin, so the dialog matches the rest of the admin.
 */
export default function UnsavedChangesBlocker({
	when,
	skipRef,
}: {
	when: boolean
	// Set right before a navigation that must not be blocked, e.g. after deleting the navigation
	skipRef: React.RefObject<boolean>
}) {
	const { formatMessage } = useIntl()

	// Closing or reloading the tab cannot show the dialog, the browser shows its own prompt instead
	useEffect(() => {
		if (!when) return

		const warn = (event: BeforeUnloadEvent) => event.preventDefault()
		window.addEventListener('beforeunload', warn)
		return () => window.removeEventListener('beforeunload', warn)
	}, [when])

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			when &&
			!skipRef.current &&
			(currentLocation.pathname !== nextLocation.pathname ||
				currentLocation.search !== nextLocation.search),
	)

	if (blocker.state !== 'blocked') return null

	return (
		<Dialog.Root
			open
			onOpenChange={(isOpen: boolean) => {
				if (!isOpen) blocker.reset()
			}}
		>
			<Dialog.Content>
				<Dialog.Header>
					{formatMessage({
						id: 'app.components.ConfirmDialog.title',
						defaultMessage: 'Confirmation',
					})}
				</Dialog.Header>
				<Dialog.Body
					icon={<WarningCircle width="24px" height="24px" fill="danger600" />}
					textAlign="center"
				>
					{formatMessage({
						id: 'global.prompt.unsaved',
						defaultMessage: 'You have unsaved changes, are you sure you want to leave?',
					})}
				</Dialog.Body>
				<Dialog.Footer>
					<Dialog.Cancel>
						<Button variant="tertiary" fullWidth>
							{formatMessage({
								id: 'app.components.Button.cancel',
								defaultMessage: 'Cancel',
							})}
						</Button>
					</Dialog.Cancel>
					<Button onClick={() => blocker.proceed()} variant="danger" fullWidth>
						{formatMessage({
							id: 'app.components.Button.confirm',
							defaultMessage: 'Confirm',
						})}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	)
}
