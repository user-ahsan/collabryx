"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { validateProfileSettings } from "@/lib/validations/settings"
import { toast } from "sonner"

export function ProfileSettingsTab({ userId }: { userId: string }) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const locationInputRef = useRef<HTMLInputElement>(null)
    const [isPlacesApiLoaded, setIsPlacesApiLoaded] = useState(false)

    const [profile, setProfile] = useState({
        display_name: "",
        full_name: "",
        headline: "",
        bio: "",
        location: "",
        website_url: ""
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (process.env.NODE_ENV === 'development') {
                    setProfile({
                        display_name: "Dev User",
                        full_name: "Developer Name",
                        headline: "Senior Software Engineer",
                        bio: "Building cool things.",
                        location: "San Francisco, CA",
                        website_url: "https://dev.example.com"
                    })
                    setIsLoading(false)
                    return
                }

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
                }
            } catch (err) {
                console.error("Error fetching profile:", err)
                setError("Failed to load profile details.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [userId, supabase])

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any
        if (w.google && w.google.maps && w.google.maps.places) {
            setIsPlacesApiLoaded(true)
            return
        }

        const scriptId = 'google-maps-script'
        if (document.getElementById(scriptId)) {
            setIsPlacesApiLoaded(true)
            return
        }

        const script = document.createElement('script')
        script.id = scriptId
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => setIsPlacesApiLoaded(true)
        document.body.appendChild(script)
    }, [])

    useEffect(() => {
        if (!isPlacesApiLoaded || !locationInputRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any
        const autocomplete = new w.google.maps.places.Autocomplete(locationInputRef.current, {
            types: ['(cities)'],
        })

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place && (place.formatted_address || place.name)) {
                setProfile(prev => ({ ...prev, location: place.formatted_address || place.name }))
            }
        })
    }, [isPlacesApiLoaded])

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
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                setSuccessMsg("Profile saved successfully (Dev mode).")
                setTimeout(() => setSuccessMsg(null), 3000)
                return
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    display_name: profile.display_name,
                    full_name: profile.full_name,
                    headline: profile.headline,
                    bio: profile.bio,
                    location: profile.location,
                    website_url: profile.website_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) throw updateError
            setSuccessMsg("Profile saved successfully.")
            toast.success("Profile updated")

            // Re-fetch to ensure sync
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (err: unknown) {
            console.error(err)
            const errorMessage = err instanceof Error ? err.message : "Failed to save profile."
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
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your public profile details.</CardDescription>
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
                            className="bg-white/5 border-white/10 opacity-70 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            value={profile.display_name}
                            onChange={(e) => updateField("display_name", e.target.value)}
                            className="bg-white/5 border-white/10 focus:border-primary/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                            id="headline"
                            value={profile.headline}
                            onChange={(e) => updateField("headline", e.target.value)}
                            placeholder="e.g. Software Engineer at TechStart"
                            className="bg-white/5 border-white/10 focus:border-primary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            ref={locationInputRef}
                            value={profile.location}
                            onChange={(e) => updateField("location", e.target.value)}
                            placeholder="e.g. San Francisco, CA"
                            className="bg-white/5 border-white/10 focus:border-primary/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website_url">Website / Portfolio</Label>
                    <Input
                        id="website_url"
                        value={profile.website_url}
                        onChange={(e) => updateField("website_url", e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="bg-white/5 border-white/10 focus:border-primary/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        className="h-24 resize-none bg-white/5 border-white/10 focus:border-primary/50"
                        value={profile.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        placeholder="A short bio about yourself..."
                    />
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="mt-4">
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isSaving ? "Saving..." : "Save Profile"}
                </Button>
            </CardContent>
        </Card>
    )
}
