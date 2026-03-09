"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserPlus, Bookmark, BookmarkCheck, Flag, Copy, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlassDropdownMenuProps {
    children?: React.ReactNode
    className?: string
}

export function GlassDropdownMenu({ children, className }: GlassDropdownMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full", className)}>
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">Options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-48 bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg rounded-xl p-1"
            >
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface GlassDropdownMenuItemProps {
    children: React.ReactNode
    onClick?: () => void
    icon?: React.ReactNode
    destructive?: boolean
}

export function GlassDropdownMenuItem({ children, onClick, icon, destructive }: GlassDropdownMenuItemProps) {
    return (
        <DropdownMenuItem 
            onClick={onClick}
            className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-sm",
                destructive && "text-destructive focus:text-destructive"
            )}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </DropdownMenuItem>
    )
}

export function GlassDropdownMenuSeparator() {
    return <DropdownMenuSeparator className="my-1 bg-border/50" />
}

// Pre-built Match Card Options Dropdown
interface MatchCardDropdownProps {
    isSaved?: boolean
    onSave?: () => void
    onViewProfile?: () => void
    onReport?: () => void
    onCopyLink?: () => void
}

export function MatchCardDropdown({
    isSaved = false,
    onSave,
    onViewProfile,
    onReport,
    onCopyLink
}: MatchCardDropdownProps) {
    return (
        <GlassDropdownMenu>
            <GlassDropdownMenuItem 
                icon={<Eye className="h-4 w-4" />}
                onClick={onViewProfile}
            >
                View Profile
            </GlassDropdownMenuItem>
            <GlassDropdownMenuItem 
                icon={isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                onClick={onSave}
            >
                {isSaved ? "Saved" : "Save for Later"}
            </GlassDropdownMenuItem>
            <GlassDropdownMenuSeparator />
            <GlassDropdownMenuItem 
                icon={<Copy className="h-4 w-4" />}
                onClick={onCopyLink}
            >
                Copy Link
            </GlassDropdownMenuItem>
            <GlassDropdownMenuItem 
                icon={<Flag className="h-4 w-4" />}
                onClick={onReport}
                destructive
            >
                Report
            </GlassDropdownMenuItem>
        </GlassDropdownMenu>
    )
}

// Pre-built Post Card Options Dropdown (replaces the existing PostOptionsDropdown)
interface PostCardDropdownProps {
    isOwner?: boolean
    onDelete?: () => void
    onEdit?: () => void
    onReport?: () => void
}

export function PostCardDropdown({
    isOwner = false,
    onDelete,
    onEdit,
    onReport
}: PostCardDropdownProps) {
    return (
        <GlassDropdownMenu>
            <GlassDropdownMenuItem 
                icon={<Copy className="h-4 w-4" />}
                onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
                Copy Link
            </GlassDropdownMenuItem>
            {isOwner ? (
                <>
                    <GlassDropdownMenuSeparator />
                    <GlassDropdownMenuItem 
                        icon={<Eye className="h-4 w-4" />}
                    >
                        View Post
                    </GlassDropdownMenuItem>
                    <GlassDropdownMenuItem 
                        icon={<UserPlus className="h-4 w-4" />}
                    >
                        Share Post
                    </GlassDropdownMenuItem>
                    <GlassDropdownMenuSeparator />
                    <GlassDropdownMenuItem 
                        icon={<div className="h-4 w-4" />}
                        onClick={onEdit}
                    >
                        Edit Post
                    </GlassDropdownMenuItem>
                    <GlassDropdownMenuItem 
                        icon={<div className="h-4 w-4" />}
                        onClick={onDelete}
                        destructive
                    >
                        Delete Post
                    </GlassDropdownMenuItem>
                </>
            ) : (
                <>
                    <GlassDropdownMenuSeparator />
                    <GlassDropdownMenuItem 
                        icon={<Flag className="h-4 w-4" />}
                        onClick={onReport}
                        destructive
                    >
                        Report Post
                    </GlassDropdownMenuItem>
                </>
            )}
        </GlassDropdownMenu>
    )
}
