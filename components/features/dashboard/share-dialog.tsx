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
import { Copy, Link2, Twitter, Linkedin, Facebook, Mail, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

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
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const shareOptions = [
        { icon: Twitter, label: "X", color: "hover:border-black hover:text-black dark:text-white dark:hover:border-white" },
        { icon: Linkedin, label: "LinkedIn", color: "hover:border-[#0077b5] hover:text-[#0077b5]" },
        { icon: Facebook, label: "Facebook", color: "hover:border-[#1877f2] hover:text-[#1877f2]" },
        { icon: Mail, label: "Email", color: "hover:border-primary hover:text-primary" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Post</DialogTitle>
                    <DialogDescription>
                        Share this post with your network or copy the link.
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
