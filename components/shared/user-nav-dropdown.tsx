"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/hooks/use-settings"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    User,
    Settings,
    LogOut,
    Sparkles
} from "lucide-react"

export function UserNavDropdown() {
    const { user, profile } = useUser()
    const { openSettings } = useSettings()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-full justify-start gap-2 rounded-xl px-2 hover:bg-accent">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || '/avatars/01.png'} alt={profile?.full_name || '@user'} />
                        <AvatarFallback>
                            {profile?.full_name 
                                ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                : user?.email?.charAt(0).toUpperCase() || 'U'
                            }
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                        <span className="font-medium">
                            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">Member</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => openSettings('profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openSettings('billing')}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span>Billing</span>
                        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openSettings('account')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
