import { Plus, EmptyDocuments } from '@strapi/icons';
import { Flex, Box, Typography, Button } from '@strapi/design-system';

export default function EmptyNav () {
  return (
    <Flex direction="column" minHeight="400px" justifyContent="center">
      <EmptyDocuments width="10rem" height="6rem"/>
      <Box padding={4}>
        <Typography variant="beta" textColor="neutral600">Your navigation is empty...</Typography>
      </Box>
      <Button
        variant='secondary'
        startIcon={<Plus/>}
        label="Label"
        // onClick={addNewNavigationItem}
      >
        New item
      </Button>
    </Flex>
  )
}