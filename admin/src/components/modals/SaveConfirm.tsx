import { ModalContext } from '../../contexts'
import { useContext } from 'react'
import { Dialog, Typography, Button, Box, Flex } from '@strapi/design-system'
import { Trash } from '@strapi/icons'
import { NestedNavItem } from '../../../../types'
import { useIntl } from 'react-intl'
import { getTranslation } from '../../utils'

type SaveConfirmProps = {
	deletedItems: NestedNavItem[]
	// Children of deleted items are kept by the server and move up one level
	hasOrphanedChildren: boolean
	onConfirm: () => void
}

export default function SaveConfirm({
	deletedItems,
	hasOrphanedChildren,
	onConfirm,
}: SaveConfirmProps) {
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
						id: getTranslation('modal.saveConfirm.title'),
						defaultMessage: 'Save changes?',
					})}
				</Dialog.Header>
				<Dialog.Body>
					<Flex direction="column" alignItems="stretch" gap={3}>
						<Typography>
							{formatMessage(
								{
									id: getTranslation('modal.saveConfirm.deletedItems'),
									defaultMessage:
										'{count, plural, one {# item is} other {# items are}} deleted when saving:',
								},
								{ count: deletedItems.length },
							)}
						</Typography>
						<Box tag="ul" maxHeight="24rem" overflow="auto" paddingLeft={4}>
							{deletedItems.map((item) => (
								<li key={item.documentId}>
									<Typography fontWeight="bold">
										{item.clientModifications?.title || item.route?.title}
									</Typography>{' '}
									<Typography textColor="neutral500">
										{item.route?.type === 'internal' ? '/' : ''}
										{item.clientModifications?.path || item.route?.path}
									</Typography>
								</li>
							))}
						</Box>
						{hasOrphanedChildren && (
							<Typography textColor="neutral600">
								{formatMessage({
									id: getTranslation('modal.saveConfirm.orphanedChildren'),
									defaultMessage: 'Children of deleted items are kept and move up one level.',
								})}
							</Typography>
						)}
						<Typography>
							{formatMessage({
								id: getTranslation('modal.delete.message.end'),
								defaultMessage: 'This can not be undone. Are you sure?',
							})}
						</Typography>
					</Flex>
				</Dialog.Body>
				<Dialog.Footer>
					<Dialog.Cancel>
						<Button onClick={() => setModalType('')} variant="tertiary">
							{formatMessage({
								id: getTranslation('cancel'),
								defaultMessage: 'Cancel',
							})}
						</Button>
					</Dialog.Cancel>
					<Dialog.Action>
						<Button variant="danger-light" onClick={onConfirm} startIcon={<Trash />}>
							{formatMessage({
								id: getTranslation('modal.saveConfirm.confirm'),
								defaultMessage: 'Save and delete',
							})}
						</Button>
					</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	)
}
