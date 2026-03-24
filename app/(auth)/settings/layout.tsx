import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, account preferences, and notifications.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
