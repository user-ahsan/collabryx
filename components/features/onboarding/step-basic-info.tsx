"use client"

import React, { useEffect, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface StepBasicInfoProps {
    userName?: string
}

export function StepBasicInfo({ userName }: StepBasicInfoProps) {
    const { register, setValue, watch, formState: { errors } } = useFormContext()
    const locationInputRef = useRef<HTMLInputElement | null>(null)
    const [isPlacesApiLoaded, setIsPlacesApiLoaded] = useState(() => {
        if (typeof window === "undefined") return false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any
        return !!(w.google && w.google.maps && w.google.maps.places)
    })

    // Setup Google Places API if key exists
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey || isPlacesApiLoaded) return

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
         
    }, [isPlacesApiLoaded])

    useEffect(() => {
        if (!isPlacesApiLoaded || !locationInputRef.current) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="space-y-8">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight">
                    Hey{userName ? ` ${userName}` : ''}! 👋
                </h2>
                <p className="text-lg text-muted-foreground">Kindly fill in the following to complete your profile.</p>
            </div>

            <div className="space-y-5">
                <div className="grid gap-2.5">
                    <Label htmlFor="fullName" className="text-base font-medium">Full Name</Label>
                    <Input
                        id="fullName"
                        defaultValue={userName}
                        placeholder="Enter your full name"
                        {...register("fullName")}
                        className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 text-base"
                    />
                    {typeof errors.fullName?.message === "string" && (
                        <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                </div>

                <div className="grid gap-2.5">
                    <Label htmlFor="displayName" className="text-base font-medium">Display Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="displayName"
                        placeholder="johndoe"
                        {...register("displayName")}
                        className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 text-base"
                    />
                </div>

                <div className="grid gap-2.5">
                    <Label htmlFor="headline" className="text-base font-medium">Headline / Role</Label>
                    <Input
                        id="headline"
                        placeholder="e.g. Full Stack Developer @ TechStart"
                        {...register("headline")}
                        className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 text-base"
                    />
                    {typeof errors.headline?.message === "string" && (
                        <p className="text-sm text-destructive">{errors.headline.message}</p>
                    )}
                </div>

                <div className="grid gap-2.5">
                    <Label htmlFor="location" className="text-base font-medium">Location <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="location"
                        placeholder="e.g. San Francisco, CA"
                        {...locationRegister}
                        ref={(e) => {
                            locationRegister.ref(e)
                            locationInputRef.current = e
                        }}
                        className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 text-base"
                    />
                </div>
            </div>
        </div>
    )
}
