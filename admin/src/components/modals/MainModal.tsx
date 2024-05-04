import { Typography, ModalLayout, ModalBody, ModalHeader, ModalFooter } from '@strapi/design-system';
import { useContext } from 'react';
import { ModalContext } from '../../contexts';
import { MainModal } from '../../types';


export default function MainModal ({ title, body, startAction, endAction }: MainModal) {

  const contextValue = useContext(ModalContext);
  let setOpenModal = (_: string) => {};  

  if (contextValue !== null) {
    [, setOpenModal] = contextValue;
  }

  return (
    <ModalLayout onClose={() => setOpenModal('')} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2">
          {title}
        </Typography>
      </ModalHeader>
      <ModalBody>
        {body}
      </ModalBody>
      <ModalFooter 
        startActions={startAction} 
        endActions={endAction}
      />
    </ModalLayout>
  )
}