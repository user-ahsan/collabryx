"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AlignJustify } from "lucide-react"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sheet when route changes
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <div className="sticky top-0 z-50 w-full flex items-center gap-4 border-b bg-background/95 backdrop-blur p-4 md:hidden supports-[backdrop-filter]:bg-background/60">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <AlignJustify className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r w-72">
                    <SidebarNav className="h-full border-none" isMobile={true} />
                </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                    <span className="text-sm">C</span>
                </div>
                <span>Collabryx</span>
            </Link>
        </div>
    )
}
