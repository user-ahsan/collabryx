"use client"

import { usePathname } from "next/navigation"
import { PublicNav } from "@/components/shared/public-nav"
import { PublicFooter } from "@/components/shared/public-footer"

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isAuthPage = pathname === "/login" || pathname === "/register"

    if (isAuthPage) {
        return <main className="flex-1">{children}</main>
    }

    return (
        <div className="flex min-h-screen flex-col">
            <PublicNav />
            <main className="flex-1">{children}</main>
            <PublicFooter />
        </div>
    )
}
