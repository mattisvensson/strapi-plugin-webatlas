import { Typography } from '@strapi/design-system'

export default function SettingTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="sigma" textColor="neutral600">
      {children}
    </Typography>
  )
}