"use client"

import React, { useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { toast } from "sonner"

interface StepBasicInfoProps {
    userName?: string
    onNameExtracted?: (displayName: string) => void
}

export function StepBasicInfo({ userName, onNameExtracted }: StepBasicInfoProps) {
    const { register, setValue, formState: { errors }, watch } = useFormContext()
    const locationInputRef = useRef<HTMLInputElement | null>(null)
    const fullNameValue = watch("fullName")

    // Extract display name from full name using regex
    useEffect(() => {
        if (fullNameValue && onNameExtracted) {
            // Extract first name or create display name from full name
            const displayName = fullNameValue
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .slice(0, 30) // Limit length
            
            onNameExtracted(displayName)
        }
    }, [fullNameValue, onNameExtracted])

    // Location validation helper
    const validateLocation = (value: string) => {
        if (!value) return true // Optional field
        // Basic location format validation: City, State/Country or City, State Code
        const locationPattern = /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/
        if (!locationPattern.test(value)) {
            return "Please enter location in format: City, State or City, Country"
        }
        return true
    }

    const locationRegister = register("location")

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Hey{userName ? ` ${userName}` : ''}! 👋
                </h2>
                <p className="text-base text-muted-foreground">Kindly fill in the following to complete your profile.</p>
            </div>

            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">Full Name</Label>
                    <Input
                        id="fullName"
                        defaultValue={userName}
                        placeholder="e.g. John Doe"
                        {...register("fullName", {
                            required: "Full name is required",
                            minLength: {
                                value: 2,
                                message: "Name must be at least 2 characters"
                            },
                            pattern: {
                                value: /^[A-Za-z\s]+$/,
                                message: "Name can only contain letters and spaces"
                            }
                        })}
                        className={cn(
                            "h-11 text-sm",
                            glass("input")
                        )}
                    />
                    {errors.fullName?.message && (
                        <p className="text-xs text-destructive font-medium">{errors.fullName.message as string}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">Display Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="displayName"
                        placeholder="johndoe"
                        {...register("displayName", {
                            pattern: {
                                value: /^[a-z0-9_]+$/,
                                message: "Display name can only contain lowercase letters, numbers, and underscores"
                            },
                            maxLength: {
                                value: 30,
                                message: "Display name must be less than 30 characters"
                            }
                        })}
                        className={cn(
                            "h-11 text-sm",
                            glass("input")
                        )}
                    />
                    {errors.displayName?.message && (
                        <p className="text-xs text-destructive font-medium">{errors.displayName.message as string}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="headline" className="text-sm font-semibold text-foreground">Headline</Label>
                    <Input
                        id="headline"
                        placeholder="e.g. Full Stack Developer @ TechStart"
                        {...register("headline", {
                            required: "Headline is required",
                            minLength: {
                                value: 5,
                                message: "Headline must be at least 5 characters"
                            },
                            maxLength: {
                                value: 100,
                                message: "Headline must be less than 100 characters"
                            },
                            validate: {
                                noSpecialChars: (value) => 
                                    /^[a-zA-Z0-9\s@.,&'()-]+$/.test(value) || 
                                    "Headline can only contain letters, numbers, and basic punctuation"
                            }
                        })}
                        className={cn(
                            "h-11 text-sm",
                            glass("input")
                        )}
                    />
                    {errors.headline?.message && (
                        <p className="text-xs text-destructive font-medium">{errors.headline.message as string}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="location" className="text-sm font-semibold text-foreground">Location <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        id="location"
                        placeholder="e.g. San Francisco, CA"
                        {...locationRegister}
                        ref={(e) => {
                            locationRegister.ref(e)
                            locationInputRef.current = e
                        }}
                        className={cn(
                            "h-11 text-sm",
                            glass("input")
                        )}
                        onBlur={(e) => {
                            const value = e.target.value
                            if (value) {
                                const validation = validateLocation(value)
                                if (validation !== true) {
                                    toast.error(validation)
                                    setValue('location', '', { shouldValidate: true })
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
