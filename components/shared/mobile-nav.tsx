"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlignJustify, Bell, User, Settings, LogOut } from "lucide-react"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { NotificationsWidget } from "@/components/features/dashboard/notifications-widget"
import { useSettings } from "@/hooks/use-settings"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function MobileNav() {
    const [open, setOpen] = useState(false)

    const pathname = usePathname()
    const { openSettings } = useSettings()

    // Close sheet when route changes
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <>
            <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-3 py-2.5 md:hidden supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <AlignJustify className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r w-72">
                            <div className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </div>
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
                <div className="flex items-center gap-1">
                    <NotificationsWidget>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
                        >
                            <Bell className="h-[18px] w-[18px]" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 border border-background" />
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </NotificationsWidget>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border">
                                    <AvatarImage src="/avatars/05.png" />
                                    <AvatarFallback className="text-xs">MR</AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48" align="end" sideOffset={8}>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-0.5">
                                    <p className="text-sm font-medium">Sophie Chen</p>
                                    <p className="text-xs text-muted-foreground">sophie@example.com</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => openSettings('profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openSettings('account')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

        </>
    )
}
