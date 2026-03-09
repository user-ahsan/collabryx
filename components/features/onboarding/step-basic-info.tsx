"use client"

import React, { useEffect, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function StepBasicInfo() {
    const { register, setValue, formState: { errors } } = useFormContext()
    const locationInputRef = useRef<HTMLInputElement | null>(null)
    const [isPlacesApiLoaded, setIsPlacesApiLoaded] = useState(false)

    // Setup Google Places API if key exists
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) return

        const w = window as any
        if (w.google && w.google.maps && w.google.maps.places) {
            setIsPlacesApiLoaded(true)
            return
        }

        const scriptId = 'google-maps-script'
        if (document.getElementById(scriptId)) return

        const script = document.createElement('script')
        script.id = scriptId
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => setIsPlacesApiLoaded(true)
        document.body.appendChild(script)

        return () => {
            // cleanup if necessary, but usually keeping it loaded is fine
        }
    }, [])

    useEffect(() => {
        if (!isPlacesApiLoaded || !locationInputRef.current) return

        const w = window as any
        const autocomplete = new w.google.maps.places.Autocomplete(locationInputRef.current, {
            types: ['(cities)'],
        })

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (place && place.formatted_address) {
                setValue('location', place.formatted_address, { shouldValidate: true, shouldDirty: true })
            } else if (place && place.name) {
                setValue('location', place.name, { shouldValidate: true, shouldDirty: true })
            }
        })
    }, [isPlacesApiLoaded, setValue])

    const locationRegister = register("location")

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Basic Information</h2>
                <p className="text-muted-foreground">Tell us a bit about yourself to get started.</p>
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        placeholder="John Doe"
                        {...register("fullName")}
                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                    />
                    {typeof errors.fullName?.message === "string" && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="displayName"
                        placeholder="johndoe"
                        {...register("displayName")}
                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="headline">Headline / Role</Label>
                    <Input
                        id="headline"
                        placeholder="e.g. Full Stack Developer @ TechStart"
                        {...register("headline")}
                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                    />
                    {typeof errors.headline?.message === "string" && (
                        <p className="text-sm text-destructive">{errors.headline.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="location">Location <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="location"
                        placeholder="e.g. San Francisco, CA"
                        {...locationRegister}
                        ref={(e) => {
                            locationRegister.ref(e)
                            locationInputRef.current = e
                        }}
                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                    />
                </div>
            </div>
        </div>
    )
}
