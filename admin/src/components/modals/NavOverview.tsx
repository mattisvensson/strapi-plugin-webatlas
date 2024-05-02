import { Flex, Box, Typography, Divider, Button } from '@strapi/design-system';
import { Check, Pencil, Trash } from '@strapi/icons';



export default function NavOverview ({ navigations, setIsVisible }) {
  return (
    <>
      {navigations.map((nav, index: number) => (
        <>
          <Flex justifyContent="space-between" key={`box-${nav.slug}`}>
            <Typography textColor="neutral800">
              {nav.name}
            </Typography>
            <Flex gap={2}>
              <Button startIcon={<Trash />} variant="secondary">Delete</Button>
              <Button startIcon={<Pencil />} variant="secondary">Edit</Button>
              <Button startIcon={<Check />} variant="primary">Select</Button>
            </Flex>
          </Flex>
          {navigations.length - 1 !== index && <Box
            paddingTop={2}
            paddingBottom={2}
          >
            <Divider />
          </Box>}
        </>
      ))}
    </>
  )
}