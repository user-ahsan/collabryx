"use client"

import * as React from "react"
import { Globe } from "@/components/ui/globe"
import { motion } from "motion/react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface AuthLayoutProps {
    children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-background grid lg:grid-cols-2">
            {/* Left Column - Form */}
            <div className="relative flex flex-col justify-center px-4 sm:px-6 lg:px-10 xl:px-20 py-10">
                {/* Navigation (Back Button) */}
                <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-50">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Back to Home</span>
                    </Link>
                </div>

                <div className="w-full max-w-[450px] mx-auto z-10">
                    {children}
                </div>
            </div>

            {/* Right Column - Globe / Visual */}
            {/* Right Column - Globe / Visual */}
            <div className="hidden lg:flex relative overflow-hidden items-center justify-center h-full">
                <Globe className="relative opacity-40" />
            </div>
        </div>
    )
}
