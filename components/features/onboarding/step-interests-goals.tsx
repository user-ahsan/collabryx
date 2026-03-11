"use client"

import React, { useState, useMemo } from "react"
import { useFormContext, Controller, useWatch } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { GlassCard } from "@/components/shared/glass-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const GOAL_OPTIONS = [
    { id: "find-cofounder", label: "Find a Co-Founder", description: "Looking for partners to start a new venture." },
    { id: "join-project", label: "Join a Project", description: "Want to contribute to an existing team or project." },
    { id: "networking", label: "Networking", description: "Expand professional connections and meet like-minded people." },
    { id: "mentorship", label: "Mentorship", description: "Looking for guidance or offering to mentor others." },
    { id: "freelance", label: "Freelance/Contract Work", description: "Available for short-term or contract opportunities." },
]

const DYNAMIC_GOALS: Record<string, { id: string, label: string, description: string }[]> = {
    "business": [
        { id: "investor", label: "Investor", description: "Looking to invest in promising startups or projects." },
        { id: "sales-manager", label: "Sales & Growth", description: "Looking to drive sales, marketing, and business growth." }
    ],
    "tech": [
        { id: "tech-lead", label: "Technical Leadership", description: "Looking to guide architecture and mentor engineers." },
        { id: "open-source", label: "Open Source Contributor", description: "Want to collaborate on public and open-source software." }
    ],
    "finance": [
        { id: "financial-advisor", label: "Financial Modeling", description: "Help build financial projections and models." }
    ],
    "design": [
        { id: "ui-ux", label: "UI/UX Design", description: "Looking to design user experiences and interfaces." }
    ]
}

export function StepInterestsAndGoals() {
    const { control, formState: { errors } } = useFormContext()
    const [interestInput, setInterestInput] = useState("")

const interests = useWatch({ control, name: "interests" })

    const dynamicGoals = useMemo(() => {
        const result: typeof GOAL_OPTIONS = []
        const interestsArray = interests || []
        interestsArray.forEach((interest: string) => {
            const lower = interest.toLowerCase()
            Object.entries(DYNAMIC_GOALS).forEach(([key, goals]) => {
                if (lower.includes(key)) {
                    goals.forEach(g => {
                        if (!result.find(r => r.id === g.id)) result.push(g)
                    })
                }
            })
        })
        return result
    }, [interests])

    const allGoals = [...GOAL_OPTIONS, ...dynamicGoals]

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight">Interests & Goals</h2>
                <p className="text-lg text-muted-foreground">What industries do you care about, and what are you here to do?</p>
            </div>

            <Controller
                control={control}
                name="goals"
                render={({ field }) => {
                    const currentGoals = field.value || []

                    const handleCheckedChange = (goalId: string, checked: boolean) => {
                        if (checked) {
                            field.onChange([...currentGoals, goalId])
                        } else {
                            field.onChange(currentGoals.filter((id: string) => id !== goalId))
                        }
                    }

                    return (
                        <div className="space-y-5 pt-2">
                            <div className="space-y-1">
                                <Label className="font-semibold text-lg">Collaboration Goals <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                <p className="text-base text-muted-foreground">Select all that apply.</p>
                            </div>
                            {typeof errors.goals?.message === "string" && (
                                <p className="text-sm text-destructive pb-1">{errors.goals.message}</p>
                            )}

                            {allGoals.map((goal) => {
                                const isSelected = currentGoals.includes(goal.id)
                                return (
                                    <GlassCard
                                        key={goal.id}
                                        hoverable
                                        className={cn(
                                            "relative cursor-pointer transition-all duration-300",
                                            isSelected ? "border-primary/50 bg-primary/5" : "border-border/10",
                                        )}
                                        innerClassName="p-5 sm:p-6 flex flex-row items-start space-x-4"
                                    >
                                        {/* Invisible label covering the whole card entirely */}
                                        <Label htmlFor={goal.id} className="absolute inset-0 z-10 cursor-pointer">
                                            <span className="sr-only">Toggle {goal.label}</span>
                                        </Label>

                                        <div className="flex pt-1 shrink-0 relative z-20 pointer-events-none">
                                            <Checkbox
                                                id={goal.id}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => handleCheckedChange(goal.id, checked === true)}
                                                className={cn("h-6 w-6 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", isSelected && "border-primary")}
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1 space-y-1.5 relative z-20 pointer-events-none">
                                            <div className="font-semibold text-lg leading-none">
                                                {goal.label}
                                            </div>
                                            <p className="text-base text-muted-foreground leading-relaxed">
                                                {goal.description}
                                            </p>
                                        </div>
                                    </GlassCard>
                                )
                            })}
                        </div>
                    )
                }}
            />

            <Controller
                control={control}
                name="interests"
                render={({ field }) => {
                    const currentInterests = field.value || []

                    const handleAddInterest = (e?: React.KeyboardEvent | React.MouseEvent) => {
                        if (e && 'key' in e && e.key !== "Enter") return
                        e?.preventDefault()

                        const trimmed = interestInput.trim()
                        if (trimmed && !currentInterests.includes(trimmed)) {
                            field.onChange([...currentInterests, trimmed])
                            setInterestInput("")
                        }
                    }

                    const handleRemoveInterest = (toRemove: string) => {
                        field.onChange(currentInterests.filter((s: string) => s !== toRemove))
                    }

                    return (
                        <div className="space-y-4 pt-8 border-t border-border/10">
                            <Label htmlFor="interestsInput" className="font-semibold text-lg">Your Interests / Industries</Label>
                            <p className="text-base text-muted-foreground">E.g., Fintech, EdTech, Web3, AI, Business</p>
                            <div className="flex gap-3">
                                <Input
                                    id="interestsInput"
                                    value={interestInput}
                                    onChange={(e) => setInterestInput(e.target.value)}
                                    onKeyDown={handleAddInterest}
                                    placeholder="Add an interest (Press Enter)"
                                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 text-base"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddInterest}
                                    className="flex items-center justify-center px-4 rounded-md bg-white/10 text-white hover:bg-white/20 transition-all duration-300 border border-white/10"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            {typeof errors.interests?.message === "string" && (
                                <p className="text-sm text-destructive">{errors.interests.message}</p>
                            )}

                            {currentInterests.length > 0 && (
                                <div className="flex flex-wrap gap-3 pt-3">
                                    {currentInterests.map((interest: string) => (
                                        <Badge key={interest} variant="secondary" className="px-4 py-2 text-base gap-2 pl-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-none">
                                            {interest}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveInterest(interest)}
                                                className="p-1 rounded-full hover:bg-primary/20 transition-colors ml-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }}
            />

        </div>
    )
}
