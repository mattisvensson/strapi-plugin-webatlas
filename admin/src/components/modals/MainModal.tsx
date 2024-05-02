import { Flex, Box, Typography, ModalLayout, ModalBody, ModalHeader, ModalFooter, Divider, Button, IconButton } from '@strapi/design-system';


export default function MainModal ({ setIsVisible, title, body, startAction, endAction }) {
  return (
    <ModalLayout onClose={() => setIsVisible('')} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
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