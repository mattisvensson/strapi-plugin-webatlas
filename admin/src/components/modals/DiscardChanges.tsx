import { ModalContext } from '../../contexts'
import { useContext } from 'react'
import { Dialog, Button } from '@strapi/design-system'
import { WarningCircle } from '@strapi/icons'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../utils'

export default function DiscardChanges({ onConfirm }: { onConfirm: () => void }) {
	const { setModalType } = useContext(ModalContext)
	const { formatMessage } = useIntl()

	return (
		<Dialog.Root
			defaultOpen={true}
			onOpenChange={(open: boolean) => {
				if (!open) setModalType('')
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
						id: getTranslation('modal.discardChanges.message'),
						defaultMessage:
							'All unsaved changes of this navigation will be discarded. This can not be undone.',
					})}
				</Dialog.Body>
				<Dialog.Footer>
					<Dialog.Cancel>
						<Button variant="tertiary" fullWidth>
							{formatMessage({
								id: getTranslation('cancel'),
								defaultMessage: 'Cancel',
							})}
						</Button>
					</Dialog.Cancel>
					<Dialog.Action>
						<Button variant="danger" fullWidth onClick={onConfirm}>
							{formatMessage({
								id: getTranslation('navigation.page.discardChanges'),
								defaultMessage: 'Discard changes',
							})}
						</Button>
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	)
}
