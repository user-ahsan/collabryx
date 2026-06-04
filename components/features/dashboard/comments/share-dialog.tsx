"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Copy, Link2, Mail, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

function LinkedinIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    )
}

interface ShareDialogProps {
    isOpen: boolean
    onClose: () => void
    postUrl: string
}

export function ShareDialog({ isOpen, onClose, postUrl }: ShareDialogProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(postUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy text: ', error)
        }
    }

    const shareOptions = [
        { icon: XIcon, label: "X", color: "hover:border-black hover:text-black dark:hover:border-white" },
        { icon: LinkedinIcon, label: "LinkedIn", color: "hover:border-[#0077b5] hover:text-[#0077b5]" },
        { icon: FacebookIcon, label: "Facebook", color: "hover:border-[#1877f2] hover:text-[#1877f2]" },
        { icon: Mail, label: "Email", color: "hover:border-primary hover:text-primary" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("sm:max-w-md sm:rounded-2xl", glass("overlay"))}>
                <DialogHeader>
                    <DialogTitle>Share Post</DialogTitle>
                    <DialogDescription>
                        Copy the link below or share directly to your favorite platforms.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-6 justify-center">
                        {shareOptions.map((opt) => (
                            <div key={opt.label} className="flex flex-col items-center gap-2 group cursor-pointer">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-14 w-14 rounded-full flex items-center justify-center p-0 border-muted-foreground/20 transition-all",
                                        opt.color
                                    )}
                                >
                                    <opt.icon className="h-6 w-6 fill-current" />
                                </Button>
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{opt.label}</span>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <div className="relative">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    readOnly
                                    value={postUrl}
                                    className="pl-9 bg-muted/30 font-medium text-muted-foreground"
                                />
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCopy}
                            className={cn(
                                "px-4 min-w-[80px] transition-all",
                                copied && "bg-green-600 hover:bg-green-700 text-white"
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
