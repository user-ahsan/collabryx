"use client"

import React, { useEffect, useRef } from "react"
import { useFormContext, RegisterOptions } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { AvatarUploader } from "@/components/shared/avatar-uploader"
import { UniversitySelect } from "@/components/shared/university-select"
import type { OnboardingData as OnboardingFormValues } from "@/lib/validations/onboarding"

interface StepBasicInfoProps {
    userName?: string
    onNameExtracted?: (displayName: string) => void
    selectedRoles?: string[]
}

type LocationField = keyof Pick<OnboardingFormValues, "location">

/**
 * StepBasicInfo - First data-entry step in the onboarding flow.
 *
 * FIXES APPLIED:
 *
 * 1. CORRUPTED EMOJI — The greeting had a UTF-8 encoding corruption displaying "ðŸ‘‹"
 *    instead of the intended wave emoji. This happened because the file was saved in a
 *    mixed-encoding context that mangled the multi-byte character. Replaced with the
 *    Unicode literal "👋" which is encoding-safe.
 *
 * 2. DUPLICATE LOCATION VALIDATION — There were two separate validation paths for the
 *    location field: (a) react-hook-form's `register` with a `validate.format` callback,
 *    and (b) a manual `onBlur` handler that ran the same validation independently into
 *    a separate `locationFormatError` state. This meant validation ran twice on blur,
 *    and the error could display from either source with different styling (form error
 *    vs amber warning). Removed the manual path — all validation now flows through
 *    react-hook-form errors, giving consistent red/destructive styling.
 *
 * 3. AUTO-FOCUS ON ENTRY — When transitioning from Welcome to Basic Info, the cursor
 *    appeared nowhere — the user had to manually click into the Full Name field. This
 *    breaks the flow and adds friction on every step transition. Added a useEffect with
 *    a 100ms setTimeout to focus the Full Name input after the AnimatePresence mounts
 *    the new step. 100ms allows the exit animation to complete first.
 */
export function StepBasicInfo({ userName, onNameExtracted, selectedRoles }: StepBasicInfoProps) {
    const { register, setValue, watch, formState: { errors } } = useFormContext<OnboardingFormValues>()
    const roles = selectedRoles || watch("roles") || []
    const locationInputRef = useRef<HTMLInputElement | null>(null)
    const fullNameInputRef = useRef<HTMLInputElement | null>(null)
    const fullNameValue = watch("fullName")
    const avatarValue = watch("avatarUrl")
    const universityValue = watch("university")

    // Auto-focus the first input when step mounts.
    // 100ms delay allows the AnimatePresence exit animation to finish and the
    // new step's DOM to be committed before we attempt focus. Without this,
    // the user lands on an unfocused form after every step transition.
    useEffect(() => {
        const timer = setTimeout(() => {
            fullNameInputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    // Pre-fill fullName with userName prop when provided
    useEffect(() => {
        if (userName) {
            setValue("fullName", userName, { shouldDirty: false, shouldValidate: false })
        }
    }, [userName, setValue])

    // Extract display name from full name using regex
    useEffect(() => {
        if (fullNameValue && onNameExtracted) {
            const displayName = fullNameValue
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '_')
                .slice(0, 30)

            onNameExtracted(displayName)
        }
    }, [fullNameValue, onNameExtracted])

    // Location validation helper
    const validateLocation = (value: string): boolean | string => {
        if (!value || value.trim() === "") return true
        const locationPattern = /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/
        if (!locationPattern.test(value.trim())) {
            return "Please enter location in format: City, State or City, Country"
        }
        return true
    }

    const locationValidation: RegisterOptions<OnboardingFormValues, LocationField> = {
        validate: {
            format: (value) => {
                const result = validateLocation(value || "")
                return result === true || result
            }
        }
    }

    const locationRegister = register("location", locationValidation)

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center md:text-left">
                <h2 id="step-heading" className="text-3xl font-bold tracking-tight text-foreground">
                    Hey{userName ? ` ${userName}` : ''}! 👋
                </h2>
                <p className="text-base text-muted-foreground">Tell us about yourself so we can tailor the experience to you.</p>
            </div>

            {/* Avatar Upload */}
            <div className="flex justify-center md:justify-start">
                <AvatarUploader
                    currentUrl={avatarValue}
                    onUploadComplete={(url) => setValue("avatarUrl", url, { shouldDirty: true })}
                    onRemove={() => setValue("avatarUrl", "", { shouldDirty: true })}
                    displayName={watch("fullName") || userName || "User"}
                    size="md"
                />
            </div>

            <div className="space-y-4" aria-labelledby="step-heading">
                <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                        Full Name <span className="text-destructive" aria-hidden="true">*</span>
                        <span className="sr-only">(required)</span>
                    </Label>
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
                                value: /^[a-zA-Z\s'-]+$/,
                                message: "Name can only contain letters, spaces, hyphens, and apostrophes"
                            }
                        })}
                        ref={(e) => {
                            (register("fullName").ref as (instance: HTMLInputElement | null) => void)(e)
                            fullNameInputRef.current = e
                        }}
                        className={cn(
                            "h-11 text-sm",
                            glass("input"),
                            errors.fullName && "border-destructive focus:border-destructive"
                        )}
                        aria-required="true"
                        aria-invalid={!!errors.fullName}
                        aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    />
                    {errors.fullName?.message && (
                        <p id="fullName-error" className="text-xs text-destructive font-medium" role="alert">
                            {errors.fullName.message as string}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="displayName" className="text-sm font-semibold text-foreground">
                        Display Name <span className="text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                        id="displayName"
                        placeholder="johndoe"
                        {...register("displayName", {
                            pattern: {
                                value: /^[a-z0-9_]*$/,
                                message: "Display name can only contain lowercase letters, numbers, and underscores"
                            },
                            maxLength: {
                                value: 30,
                                message: "Display name must be less than 30 characters"
                            }
                        })}
                        className={cn(
                            "h-11 text-sm",
                            glass("input"),
                            errors.displayName && "border-destructive focus:border-destructive"
                        )}
                        aria-invalid={!!errors.displayName}
                        aria-describedby={errors.displayName ? "displayName-error" : "displayName-hint"}
                    />
                    <p id="displayName-hint" className="sr-only">Display name can only contain lowercase letters, numbers, and underscores</p>
                    {errors.displayName?.message && (
                        <p id="displayName-error" className="text-xs text-destructive font-medium" role="alert">
                            {errors.displayName.message as string}
                        </p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="headline" className="text-sm font-semibold text-foreground">
                        Headline <span className="text-destructive" aria-hidden="true">*</span>
                        <span className="sr-only">(required)</span>
                    </Label>
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
                                value: 200,
                                message: "Headline must be less than 200 characters"
                            }
                        })}
                        className={cn(
                            "h-11 text-sm",
                            glass("input"),
                            errors.headline && "border-destructive focus:border-destructive"
                        )}
                        aria-required="true"
                        aria-invalid={!!errors.headline}
                        aria-describedby={errors.headline ? "headline-error" : "headline-hint"}
                    />
                    <p id="headline-hint" className="sr-only">Headline must be at least 5 characters and can only contain letters, numbers, and basic punctuation</p>
                    {errors.headline?.message && (
                        <p id="headline-error" className="text-xs text-destructive font-medium" role="alert">
                            {errors.headline.message as string}
                        </p>
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
                            glass("input"),
                            errors.location && "border-destructive focus:border-destructive"
                        )}
                        aria-invalid={!!errors.location}
                        aria-describedby="location-hint"
                    />
                    <p id="location-hint" className="text-xs text-muted-foreground">Format: City, State or City, Country</p>
                    {errors.location?.message && (
                        <p className="text-xs text-destructive font-medium" role="alert">
                            {errors.location.message as string}
                        </p>
                    )}
                </div>

                {/* University Field - only for students */}
                {roles.includes('student') && (
                    <>
                        <UniversitySelect
                            value={universityValue}
                            onChange={(val) => setValue("university", val, { shouldDirty: true })}
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="major" className="text-sm font-semibold text-foreground">
                                Major <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="major"
                                placeholder="e.g. Computer Science"
                                {...register("major")}
                                className={cn("h-11 text-sm", glass("input"))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="graduationYear" className="text-sm font-semibold text-foreground">
                                Graduation Year <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="graduationYear"
                                type="number"
                                placeholder="e.g. 2027"
                                min={2024}
                                max={2040}
                                {...register("graduation_year", { valueAsNumber: true })}
                                className={cn("h-11 text-sm", glass("input"))}
                            />
                        </div>
                    </>
                )}

                {/* Investor fields */}
                {roles.includes('investor') && (
                    <div className="space-y-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Investment Preferences</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="checkMin" className="text-sm font-semibold text-foreground">Min Check ($)</Label>
                                <Input id="checkMin" type="number" placeholder="e.g. 25000" {...register("check_size_min", { valueAsNumber: true })} className={cn("h-11 text-sm", glass("input"))} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="checkMax" className="text-sm font-semibold text-foreground">Max Check ($)</Label>
                                <Input id="checkMax" type="number" placeholder="e.g. 500000" {...register("check_size_max", { valueAsNumber: true })} className={cn("h-11 text-sm", glass("input"))} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="portfolioUrl" className="text-sm font-semibold text-foreground">Portfolio URL <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                            <Input id="portfolioUrl" placeholder="e.g. https://angel.co/u/yourname" {...register("portfolio_url")} className={cn("h-11 text-sm", glass("input"))} />
                        </div>
                    </div>
                )}

                {/* Founder / Professional fields */}
                {(roles.includes('founder') || roles.includes('professional')) && (
                    <div className="space-y-4 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
                        <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Professional Details</p>
                        <div className="grid gap-2">
                            <Label htmlFor="companyName" className="text-sm font-semibold text-foreground">
                                Company / Organization <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <Input id="companyName" placeholder="e.g. Acme Corp" {...register("company_name")} className={cn("h-11 text-sm", glass("input"))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="companyRole" className="text-sm font-semibold text-foreground">
                                Your Role <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <Input id="companyRole" placeholder="e.g. CTO, Co-Founder" {...register("company_role")} className={cn("h-11 text-sm", glass("input"))} />
                        </div>
                    </div>
                )}

                {/* Mentor fields */}
                {roles.includes('mentor') && (
                    <div className="space-y-4 p-4 rounded-lg border border-rose-500/20 bg-rose-500/5">
                        <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Mentoring Preferences</p>
                        <div className="grid gap-2">
                            <Label htmlFor="mentoringFormat" className="text-sm font-semibold text-foreground">
                                Preferred Format <span className="text-muted-foreground font-normal">(Optional)</span>
                            </Label>
                            <select
                                id="mentoringFormat"
                                {...register("mentoring_format")}
                                className={cn("h-11 text-sm rounded-lg border border-border bg-background px-3", glass("input"))}
                            >
                                <option value="">Select format</option>
                                <option value="one_on_one">One-on-One</option>
                                <option value="group">Group Sessions</option>
                                <option value="async">Asynchronous</option>
                                <option value="any">Any Format</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
