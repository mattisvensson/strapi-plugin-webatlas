import { useContext } from 'react';
import { Button, Modal, Flex, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { ModalContext } from '../../contexts';

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
}) {

  const { setModalType } = useContext(ModalContext);
  
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
                  { currentModalType && (
                    <SingleSelect
                      onChange={(value: string) => setModalType(value)}
                      placeholder="Choose item type"
                      value={currentModalType || ''}
                    >
                      <SingleSelectOption value="ItemCreate">Internal item</SingleSelectOption>
                      <SingleSelectOption value="WrapperCreate">Wrapper item</SingleSelectOption>
                      <SingleSelectOption value="ExternalCreate">External item</SingleSelectOption>
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