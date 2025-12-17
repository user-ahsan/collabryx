"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PublicNav() {
    const pathname = usePathname()
    const isAuthPage = pathname === "/login" || pathname === "/register"

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="hidden font-bold sm:inline-block">Collabryx</span>
                </Link>
                <div className="ml-auto flex items-center space-x-4">
                    {!isAuthPage && (
                        <>
                            <Button asChild variant="ghost">
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
