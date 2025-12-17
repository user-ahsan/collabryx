"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Flag, Ban, Copy, Trash2, Edit } from "lucide-react"

interface PostOptionsDropdownProps {
    isOwner?: boolean
    onDelete?: () => void
    onEdit?: () => void
    onReport?: () => void
}

export function PostOptionsDropdown({
    isOwner = false,
    onDelete,
    onEdit,
    onReport
}: PostOptionsDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">Post options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                </DropdownMenuItem>
                {isOwner ? (
                    <>
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Post
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onReport}>
                            <Flag className="mr-2 h-4 w-4" />
                            Report Post
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Ban className="mr-2 h-4 w-4" />
                            Block User
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
