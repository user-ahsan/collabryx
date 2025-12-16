import { DashboardShell } from "@/components/features/dashboard/dashboard-shell"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardShell>
            {children}
        </DashboardShell>
    )
}
