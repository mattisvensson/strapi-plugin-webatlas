import { useState } from 'react';
import { Button, Modal } from '@strapi/design-system';

export default function NavModal({ 
  triggerText, 
  confirmText, 
  closeText, 
  titleText,
  children,
  onConfirm, // <-- add this
}: { 
  triggerText?: string, 
  confirmText?: string, 
  closeText?: string, 
  titleText?: string,
  children?: React.ReactNode,
  onConfirm?: () => void, // <-- add this
}) {
  const [open, setOpen] = useState(false);

  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger>
        <Button>{triggerText}</Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{ titleText }</Modal.Title>
        </Modal.Header>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (onConfirm) onConfirm();
            setOpen(false);
          }}
        >
          <Modal.Body>
            {children}
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary" type="button">{closeText}</Button>
            </Modal.Close>
            <Button type="submit">{confirmText}</Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}