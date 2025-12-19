"use client"

import { Button } from "@/components/ui/button"
import { FileText, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface SaveToProfileButtonProps {
    onClick: () => void
    className?: string
}

export function SaveToProfileButton({ onClick, className }: SaveToProfileButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-8 md:h-7 px-3 md:px-3 text-xs font-medium border-primary/30 hover:bg-primary/5 hover:border-primary/50 active:bg-primary/10 transition-all group",
                className
            )}
        >
            <Save className="h-3 w-3 mr-1.5 shrink-0" />
            <span className="hidden sm:inline">Save to Profile</span>
            <span className="sm:hidden">Save</span>
        </Button>
    )
}
