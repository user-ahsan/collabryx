"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Utility function to sanitize content for safe DOM usage
const sanitizeForDom = (content: string): string => {
    // Remove any potentially dangerous characters while preserving basic alphanumeric and safe punctuation
    return content.replace(/[^a-zA-Z0-9\s\-_]/g, '')
}

interface NavigationItem {
    name: string
    href: string
}

export const LandingHeader: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const [dynamicNav, setDynamicNav] = React.useState<NavigationItem[]>([])

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)

        // Dynamic navigation extraction with XSS protection
        const sections = document.querySelectorAll('[data-section-name]')
        const items = Array.from(sections).map(section => {
            // Sanitize the section name and ID to prevent XSS
            const rawName = section.getAttribute('data-section-name') || ''
            const sanitizedId = section.id.replace(/[^a-zA-Z0-9-_]/g, '')
            
            return {
                name: sanitizeForDom(rawName),
                href: sanitizedId ? `#${sanitizedId}` : '#'
            }
        }).filter(item => item.name && item.href !== '#')

        setDynamicNav(items)

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled || mobileMenuOpen
                    ? "bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm"
                    : "bg-transparent"
            )}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 lg:px-8">
                {/* Logo */}
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                        <div className="h-10 w-10 md:h-8 md:w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-lg">C</span>
                        </div>
                        <span className="text-xl font-bold text-foreground">
                            Collabryx
                        </span>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex lg:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-m-2.5 h-10 w-10"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                />
                            </svg>
                        )}
                        <span className="sr-only">
                            {mobileMenuOpen ? "Close menu" : "Open menu"}
                        </span>
                    </Button>
                </div>

                {/* Desktop navigation */}
                <div className="hidden lg:flex lg:gap-x-8">
                    {dynamicNav.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            scroll={false}
                            onClick={(e) => {
                                if (item.href.startsWith('#')) {
                                    e.preventDefault();
                                    // Use a sanitized selector to prevent XSS
                                    const selector = item.href.replace(/[^a-zA-Z0-9-_#]/g, '')
                                    const element = document.querySelector(selector);
                                    if (element) {
if (window && 'lenis' in window) {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            (window as any).lenis.scrollTo(element);
                                        } else {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                        }
                                        // Also update the URL hash
                                        window.history.pushState(null, '', item.href);
                                    }
                                }
                            }}
                            className="text-sm font-semibold leading-6 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Right side - Theme toggle and CTA */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
                    <AnimatedThemeToggler className="h-11 w-11 md:h-9 md:w-9" />
                    <Button asChild size="sm">
                        <Link href="/login">Get Started</Link>
                    </Button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden">
                    <div className="space-y-2 px-6 pb-6 pt-2">
                        {dynamicNav.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                scroll={false}
                                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-accent cursor-pointer"
                                onClick={(e) => {
                                    if (item.href.startsWith('#')) {
                                        e.preventDefault();
                                        // Use a sanitized selector to prevent XSS
                                        const selector = item.href.replace(/[^a-zA-Z0-9-_#]/g, '')
                                        const element = document.querySelector(selector);
                                        if (element) {
if (window && 'lenis' in window) {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            (window as any).lenis.scrollTo(element);
                                            } else {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            }
                                            window.history.pushState(null, '', item.href);
                                        }
                                    }
                                    setMobileMenuOpen(false);
                                }}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="flex items-center gap-3 px-3 py-2">
                            <AnimatedThemeToggler className="h-11 w-11 md:h-9 md:w-9" />
                            <Button asChild className="flex-1">
                                <Link href="/login">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
