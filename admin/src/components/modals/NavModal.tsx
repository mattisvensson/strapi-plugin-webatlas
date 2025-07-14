import { useContext } from 'react';
import { Button, Modal } from '@strapi/design-system';
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
            <Modal.Close>
              <Button variant="tertiary" type="button">{closeText}</Button>
            </Modal.Close>
            <Button type="submit" onClick={modalToOpen ? () => setModalType(modalToOpen) : null}>{loading ? loadingText : confirmText }</Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}