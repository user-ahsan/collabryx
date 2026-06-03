"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { validateProfileSettings } from "@/lib/validations/settings"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { CollaborationSelector } from "@/components/shared/collaboration-selector"
import { Separator } from "@/components/ui/separator"

type CollaborationReadiness = "available" | "open" | "not-available"

export function ProfileSettingsTab({ userId }: { userId: string }) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [profile, setProfile] = useState({
        display_name: "",
        full_name: "",
        headline: "",
        bio: "",
        location: "",
        website_url: ""
    })
    const [collaborationReadiness, setCollaborationReadiness] = useState<CollaborationReadiness>("available")

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (error && error.code !== 'PGRST116') throw error
                if (data) {
                    setProfile({
                        display_name: data.display_name || "",
                        full_name: data.full_name || "",
                        headline: data.headline || "",
                        bio: data.bio || "",
                        location: data.location || "",
                        website_url: data.website_url || ""
                    })
                    if (data.collaboration_readiness) {
                        setCollaborationReadiness(data.collaboration_readiness)
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
                setError("Failed to load profile details.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [userId, supabase])



    const updateField = (field: string, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }))
        setError(null)
        setSuccessMsg(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        setSuccessMsg(null)

        // Validate before saving
        const validation = validateProfileSettings({
            displayName: profile.display_name,
            fullName: profile.full_name,
            headline: profile.headline,
            bio: profile.bio,
            location: profile.location,
            websiteUrl: profile.website_url,
        })

        if (!validation.success) {
            setError(validation.errors[0])
            setIsSaving(false)
            return
        }

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    display_name: profile.display_name,
                    full_name: profile.full_name,
                    headline: profile.headline,
                    bio: profile.bio,
                    location: profile.location,
                    website_url: profile.website_url,
                    collaboration_readiness: collaborationReadiness,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) throw updateError

            // Trigger embedding regeneration — profile fields (headline, bio, location, collaboration_readiness)
            // are used in the semantic embedding text for matching
            const { error: rpcError } = await supabase.rpc('regenerate_embedding', { p_user_id: userId })
            if (rpcError) console.warn("Embedding regeneration trigger failed:", rpcError)

            setSuccessMsg("Profile saved successfully.")
            toast.success("Profile updated")

            // Re-fetch to ensure sync
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (error) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : "Failed to save profile."
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsSaving(false)
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
                <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
                <CardDescription className="text-sm">Update your profile details and public information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0">
                {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
                {successMsg && <div className="text-sm font-medium text-emerald-500 bg-emerald-500/10 p-3 rounded-md">{successMsg}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="full_name">Full Name</Label>
                            <span className="text-xs text-muted-foreground italic">Unchangeable</span>
                        </div>
                        <Input
                            id="full_name"
                            value={profile.full_name}
                            disabled
                            className={cn("opacity-70 cursor-not-allowed", glass("input"))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            value={profile.display_name}
                            onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                            className={cn("focus:border-primary/50", glass("input"))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                        id="headline"
                        value={profile.headline}
                        onChange={(e) => updateField("headline", e.target.value)}
                        placeholder="e.g. Software Engineer at TechStart"
                        className={cn("focus:border-primary/50", glass("input"))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => updateField("location", e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className={cn("focus:border-primary/50", glass("input"))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website_url">Website / Portfolio</Label>
                    <Input
                        id="website_url"
                        value={profile.website_url}
                        onChange={(e) => updateField("website_url", e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className={cn("focus:border-primary/50", glass("input"))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        className={cn("min-h-[100px] resize-none focus:border-primary/50", glass("input"))}
                        value={profile.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        placeholder="A short bio about yourself..."
                    />
                </div>

                <Separator className={cn("my-2", glass("divider"))} />

                {/* Collaboration Readiness Status */}
                <div className="space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Collaboration Status</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Control whether other users see you as available for collaboration opportunities.
                            This badge is displayed on your profile header.
                        </p>
                    </div>
                    <CollaborationSelector
                        value={collaborationReadiness}
                        onChange={setCollaborationReadiness}
                    />
                </div>

                <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className={cn("mt-4", glass("buttonPrimary"), glass("buttonPrimaryGlow"))}
                >
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isSaving ? "Saving..." : "Save Profile"}
                </Button>
            </CardContent>
        </Card>
    )
}
