"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Loader2, UserX, Search, Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import type { BlockedUserWithProfile } from "@/types/database.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatInitials } from "@/lib/utils/format-initials"

interface BlockedUsersListProps {
    userId: string
}

export function BlockedUsersList({ userId }: BlockedUsersListProps) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isBlocking, setIsBlocking] = useState(false)
    const [isUnblocking, setIsUnblocking] = useState<string | null>(null)
    const [blockedUsers, setBlockedUsers] = useState<BlockedUserWithProfile[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Array<{ id: string; display_name: string | null; full_name: string | undefined; headline: string | undefined; avatar_url: string | null }>>([])
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [confirmBlockUser, setConfirmBlockUser] = useState<{ id: string; name: string } | null>(null)

    useEffect(() => {
        fetchBlockedUsers()
    }, [userId])

    const fetchBlockedUsers = async () => {
        try {
            setIsLoading(true)

            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                setBlockedUsers([
                    {
                        id: 'block-1',
                        blocker_id: userId,
                        blocked_id: 'user-2',
                        reason: 'Spam',
                        created_at: new Date().toISOString(),
                        blocked_profile: {
                            id: 'user-2',
                            display_name: 'Spam Bot',
                            avatar_url: undefined,
                            headline: 'Spam account',
                            full_name: undefined
                        }
                    }
                ])
                return
            }

            const { data, error } = await supabase
                .from('blocked_users')
                .select(`
                    id,
                    blocker_id,
                    blocked_id,
                    reason,
                    created_at,
                    blocked_profile:profiles!blocked_id (
                        id,
                        display_name,
                        full_name,
                        avatar_url,
                        headline
                    )
                `)
                .eq('blocker_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Transform the nested profile data
            const transformed = (data || []).map(item => ({
                ...item,
                blocked_profile: Array.isArray(item.blocked_profile) 
                    ? item.blocked_profile[0] 
                    : item.blocked_profile
            }))
            
            setBlockedUsers(transformed)
        } catch (error) {
            console.error('Error fetching blocked users:', error)
            toast.error('Failed to load blocked users')
        } finally {
            setIsLoading(false)
        }
    }

    const searchUsers = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }

        try {
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 300))
                setSearchResults([
                    { id: 'user-3', display_name: 'Test User', headline: 'Software Developer', avatar_url: null, full_name: undefined },
                    { id: 'user-4', display_name: 'Another User', headline: 'Designer', avatar_url: null, full_name: undefined }
                ])
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name, full_name, headline, avatar_url')
                .ilike('display_name', `%${query}%`)
                .or(`full_name.ilike.%${query}%`)
                .neq('id', userId)
                .limit(5)

            if (error) throw error

            // Filter out already blocked users
            const blockedIds = new Set(blockedUsers.map(b => b.blocked_id))
            const filtered = data?.filter(user => !blockedIds.has(user.id)) || []
            
            setSearchResults(filtered)
        } catch (error) {
            console.error('Error searching users:', error)
        }
    }

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (searchQuery) {
                searchUsers(searchQuery)
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(debounce)
    }, [searchQuery, blockedUsers, userId])

    const handleBlockUser = async (userToBlock: { id: string; name: string }) => {
        try {
            setIsBlocking(true)

            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                setBlockedUsers(prev => [
                    ...prev,
                    {
                        id: `block-${Date.now()}`,
                        blocker_id: userId,
                        blocked_id: userToBlock.id,
                        reason: undefined,
                        created_at: new Date().toISOString(),
                        blocked_profile: {
                            id: userToBlock.id,
                            display_name: userToBlock.name,
                            avatar_url: undefined,
                            headline: undefined,
                            full_name: undefined
                        }
                    }
                ])
                toast.success(`Blocked ${userToBlock.name}`)
                return
            }

            const { error } = await supabase
                .from('blocked_users')
                .insert({
                    blocker_id: userId,
                    blocked_id: userToBlock.id,
                })

            if (error) throw error

            toast.success(`Blocked ${userToBlock.name}`)
            await fetchBlockedUsers()
        } catch (error) {
            console.error('Error blocking user:', error)
            toast.error('Failed to block user')
        } finally {
            setIsBlocking(false)
            setConfirmBlockUser(null)
            setIsSearchOpen(false)
            setSearchQuery('')
        }
    }

    const handleUnblockUser = async (blockedId: string, userName?: string) => {
        try {
            setIsUnblocking(blockedId)

            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId))
                toast.success('User unblocked')
                return
            }

            const { error } = await supabase
                .from('blocked_users')
                .delete()
                .eq('blocker_id', userId)
                .eq('blocked_id', blockedId)

            if (error) throw error

            toast.success('User unblocked')
            await fetchBlockedUsers()
        } catch (error) {
            console.error('Error unblocking user:', error)
            toast.error('Failed to unblock user')
        } finally {
            setIsUnblocking(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card className={cn("border-none shadow-none bg-transparent", glass("cardInner"))}>
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">Blocked Users</CardTitle>
                </div>
                <CardDescription className="text-sm">
                    Manage users you&apos;ve blocked. They won&apos;t be able to see your profile or contact you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
                {/* Block New User */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Block a User</Label>
                    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                className={cn("w-full", glass("input"))}
                            >
                                <UserX className="h-4 w-4 mr-2" />
                                Block User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={cn("sm:max-w-md", glass("overlay"))}>
                            <DialogHeader>
                                <DialogTitle>Block User</DialogTitle>
                                <DialogDescription>
                                    Search for a user to block. They won&apos;t be notified.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={cn("pl-9", glass("input"))}
                                        autoFocus
                                    />
                                </div>

                                {searchResults.length > 0 && (
                                    <Command className={cn("rounded-lg border", glass("cardInner"))}>
                                        <CommandList>
                                            <CommandEmpty>No users found.</CommandEmpty>
                                            <CommandGroup>
                                                {searchResults.map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={user.display_name || user.full_name || ''}
                                                        onSelect={() => {
                                                            setConfirmBlockUser({
                                                                id: user.id,
                                                                name: user.display_name || user.full_name || 'User'
                                                            })
                                                        }}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={user.avatar_url || undefined} />
                                                                <AvatarFallback className="text-xs">
                                                                    {formatInitials(user.display_name || user.full_name || 'User')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {user.display_name || 'Unnamed User'}
                                                                </p>
                                                                {user.headline && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {user.headline}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                )}

                                {confirmBlockUser && (
                                    <div className="rounded-md bg-amber-500/10 p-3 border border-amber-500/20">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-amber-500">Confirm Block</p>
                                                <p className="text-muted-foreground">
                                                    Are you sure you want to block <strong>{confirmBlockUser.name}</strong>?
                                                    They won&apos;t be able to see your profile or contact you.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setConfirmBlockUser(null)
                                        setIsSearchOpen(false)
                                    }}
                                    disabled={isBlocking}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => confirmBlockUser && handleBlockUser(confirmBlockUser)}
                                    disabled={isBlocking || !confirmBlockUser}
                                >
                                    {isBlocking ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Blocking...
                                        </>
                                    ) : (
                                        "Block User"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Separator className={glass("divider")} />

                {/* Blocked Users List */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">
                        Blocked ({blockedUsers.length})
                    </Label>

                    {blockedUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No blocked users</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {blockedUsers.map((blocked) => (
                                <div
                                    key={blocked.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg",
                                        glass("cardInner")
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={blocked.blocked_profile?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {formatInitials(
                                                    blocked.blocked_profile?.display_name || 
                                                    blocked.blocked_profile?.full_name ||
                                                    'User'
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {blocked.blocked_profile?.display_name || 'Unnamed User'}
                                            </p>
                                            {blocked.blocked_profile?.headline && (
                                                <p className="text-xs text-muted-foreground">
                                                    {blocked.blocked_profile.headline}
                                                </p>
                                            )}
                                            {blocked.reason && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Reason: {blocked.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUnblockUser(blocked.blocked_id, blocked.blocked_profile?.display_name || undefined)}
                                        disabled={isUnblocking === blocked.blocked_id}
                                        className={cn("text-xs", glass("input"))}
                                    >
                                        {isUnblocking === blocked.blocked_id ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Unblocking...
                                            </>
                                        ) : (
                                            "Unblock"
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
