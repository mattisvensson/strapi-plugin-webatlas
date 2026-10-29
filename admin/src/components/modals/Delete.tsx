import { ModalContext } from '../../contexts'
import { useContext, useRef, useState } from 'react'
import { Dialog, Typography, Button } from '@strapi/design-system'
import { Trash } from '@strapi/icons'
import { NestedNavigation } from '../../../../types'
import { useIntl } from 'react-intl'
import { getTranslation, isAbortError } from '../../utils'
import { useApi, useErrorMessage } from '../../hooks'
import { useNotification } from '@strapi/strapi/admin'

type DeleteProps = {
	item: NestedNavigation
	onDelete: (editedItem: NestedNavigation) => void
}

export default function Delete({ item, onDelete }: DeleteProps) {
	const itemName = useRef(item.name)
	const closeModalState = useRef('NavOverview')

	const { setModalType } = useContext(ModalContext)
	const { formatMessage } = useIntl()
	const { deleteNavigation } = useApi()
	const { toggleNotification } = useNotification()
	const getErrorMessage = useErrorMessage()
	const [isDeleting, setIsDeleting] = useState(false)

	const handleDelete = async () => {
		setIsDeleting(true)
		try {
			await deleteNavigation(item.documentId)
			onDelete(item)
		} catch (err) {
			if (isAbortError(err)) return

			console.error(err)
			toggleNotification({
				type: 'danger',
				message: getErrorMessage(
					err,
					formatMessage({
						id: getTranslation('notification.navigation.deleteFailed'),
						defaultMessage: 'Deleting failed',
					}),
				),
			})
		}

		setModalType(closeModalState.current)
	}

	return (
		<Dialog.Root
			defaultOpen={true}
			onOpenChange={(open: boolean) => {
				if (!open) setModalType(closeModalState.current)
			}}
		>
			<Dialog.Content>
				<Dialog.Header>
					{formatMessage({
						id: getTranslation('delete'),
						defaultMessage: 'Delete',
					})}
					: "{itemName.current}"?
				</Dialog.Header>
				<Dialog.Body>
					<Typography textAlign="center">
						{formatMessage({
							id: getTranslation('modal.delete.message.start'),
							defaultMessage: 'You are about to delete the following',
						})}{' '}
						{formatMessage({
							id: getTranslation('modal.delete.message.navigation'),
							defaultMessage: 'navigation',
						})}
					</Typography>
					<Typography
						textAlign="center"
						fontWeight="bold"
						style={{ marginTop: 8, marginBottom: 8, fontSize: 20 }}
					>
						{itemName.current}
					</Typography>
					<Typography textAlign="center">
						{formatMessage({
							id: getTranslation('modal.delete.message.end'),
							defaultMessage: 'This can not be undone. Are you sure?',
						})}
					</Typography>
				</Dialog.Body>
				<Dialog.Footer>
					<Dialog.Cancel>
						<Button onClick={() => setModalType(closeModalState.current)} variant="tertiary">
							{formatMessage({
								id: getTranslation('modal.delete.cancelText'),
								defaultMessage: 'No, keep',
							})}
						</Button>
					</Dialog.Cancel>
					<Dialog.Action>
						<Button
							variant="danger-light"
							disabled={isDeleting}
							// Dialog.Action closes the dialog on click, which unmounts this component and
							// makes useFetchClient abort the running request. preventDefault keeps it open;
							// handleDelete closes it once the request finished.
							onClick={(e: React.MouseEvent) => {
								e.preventDefault()
								handleDelete()
							}}
							startIcon={<Trash />}
						>
							{formatMessage({
								id: getTranslation('modal.delete.confirmText'),
								defaultMessage: 'Yes, delete',
							})}
						</Button>
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	)
}
