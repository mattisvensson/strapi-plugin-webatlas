import { Typography, ModalHeader as StrapiModalHeader} from '@strapi/design-system';

export default function ModalHeader ({ title }: { title: string }) {
  return (
    <StrapiModalHeader>
      <Typography fontWeight="bold" textColor="neutral800" as="h2">
        {title}
      </Typography>
    </StrapiModalHeader>
  )
}