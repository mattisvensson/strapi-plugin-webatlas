import { useContext } from 'react';
import { Button, Modal, Flex, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { ModalContext } from '../../contexts';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils';

export default function NavModal({ 
  triggerText, 
  triggerVariant = "primary",
  confirmText, 
  closeText, 
  titleText,
  loadingText = 'Loading...',
  children,
  onConfirm,
  loading,
  modalToOpen,
  footer,
  currentModalType = null,
  currentModalMode = 'create',
}: { 
  triggerText?: string, 
  triggerVariant?: "primary" | "secondary",
  confirmText: string, 
  closeText: string, 
  titleText: string,
  loadingText?: string,
  children: React.ReactNode,
  onConfirm?: () => void,
  loading?: boolean,
  modalToOpen?: string,
  footer?: React.ReactNode,
  currentModalType?: 'ItemCreate' | 'WrapperCreate' | 'ExternalCreate' | null,
  currentModalMode?: 'create' | 'edit',
}) {

  const { setModalType } = useContext(ModalContext);
  const { formatMessage } = useIntl();
  
  return (
    <Modal.Root open={true} onOpenChange={() => setModalType('')}>
      {triggerText && (
        <Modal.Trigger>
          <Button variant={triggerVariant}>{triggerText}</Button>
        </Modal.Trigger>
      )}
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{ titleText }</Modal.Title>
        </Modal.Header>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (onConfirm) onConfirm();
          }}
        >
          <Modal.Body>
            {children}
          </Modal.Body>
          <Modal.Footer>
            {footer ? footer : (
              <>
                <Modal.Close>
                  <Button variant="tertiary" type="button">{closeText}</Button>
                </Modal.Close>
                <Flex gap={2}>
                  { currentModalType && currentModalMode === 'create' && (
                    <SingleSelect
                      onChange={(value: string) => setModalType(value)}
                      placeholder="Choose item type"
                      value={currentModalType || ''}
                    >
                      <SingleSelectOption value="ItemCreate">
                        {formatMessage({
                          id: getTranslation('modal.navModal.internalItem'),
                          defaultMessage: 'Internal item'
                        })}
                      </SingleSelectOption>
                      <SingleSelectOption value="WrapperCreate">
                        {formatMessage({
                          id: getTranslation('modal.navModal.wrapperItem'),
                          defaultMessage: 'Wrapper item'
                        })}
                      </SingleSelectOption>
                      <SingleSelectOption value="ExternalCreate">
                        {formatMessage({
                          id: getTranslation('modal.navModal.externalItem'),
                          defaultMessage: 'External item'
                        })}
                      </SingleSelectOption>
                    </SingleSelect>
                  )}
                  <Button type="submit" onClick={modalToOpen ? () => setModalType(modalToOpen) : null}>{loading ? loadingText : confirmText }</Button>
                </Flex>
              </>
            )}
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}