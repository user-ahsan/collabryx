"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { InlineSearchableCombobox, ComboboxOption } from "@/components/ui/inline-searchable-combobox"
import { collaborationGoals } from "@/lib/data/collaboration-goals"
import { industriesDatabase } from "@/lib/data/industries-database"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

export function StepInterestsAndGoals() {
  const { control, formState: { errors } } = useFormContext()

  // Convert goals database to combobox options
  const goalOptions: ComboboxOption[] = React.useMemo(() => 
    collaborationGoals.map(goal => ({
      id: goal.id,
      label: goal.label,
      description: goal.description,
      category: goal.category,
      keywords: goal.keywords,
    })),
    []
  )

  // Convert industries database to combobox options
  const industryOptions: ComboboxOption[] = React.useMemo(() => 
    industriesDatabase.map(industry => ({
      id: industry.id,
      label: industry.name,
      description: industry.subcategory,
      category: industry.category,
      keywords: industry.keywords,
    })),
    []
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Interests & Goals</h2>
        <p className="text-base text-muted-foreground">What industries do you care about, and what are you here to do?</p>
      </div>

      {/* Collaboration Goals */}
      <Controller
        control={control}
        name="goals"
        render={({ field }) => {
          const currentGoals = field.value || []

          return (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Collaboration Goals <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <p className="text-sm text-muted-foreground">Select all that apply from our comprehensive list.</p>
              </div>
              {typeof errors.goals?.message === "string" && (
                <p className="text-xs text-destructive font-medium">{errors.goals.message}</p>
              )}

              <InlineSearchableCombobox
                options={goalOptions}
                selected={currentGoals}
                onChange={(selected) => field.onChange(selected)}
                searchPlaceholder="Search goals (e.g., Find Co-Founder, Networking, Mentorship)..."
                emptyMessage="No goals found."
                maxHeight={350}
                allowCustom={false}
                showCategories={true}
              />

              <div className={cn(
                "p-4 rounded-lg",
                glass("subtle")
              )}>
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Select goals that match what you&apos;re looking for - from finding co-founders to networking, mentorship, freelance work, and more.
                </p>
              </div>
            </div>
          )
        }}
      />

      {/* Industries / Interests */}
      <Controller
        control={control}
        name="interests"
        render={({ field }) => {
          const currentInterests = field.value || []

          return (
            <div className="space-y-4 pt-6 border-t border-border/20">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Your Interests / Industries</Label>
                <p className="text-sm text-muted-foreground">Select industries you're interested in or working in.</p>
              </div>
              
              <InlineSearchableCombobox
                options={industryOptions}
                selected={currentInterests}
                onChange={(selected) => field.onChange(selected)}
                searchPlaceholder="Search industries (e.g., Technology, Healthcare, Construction, Plumbing)..."
                emptyMessage="No industries found. Type to add a custom industry."
                maxHeight={350}
                allowCustom={true}
                onAddCustom={(customIndustry) => {
                  if (!currentInterests.includes(customIndustry)) {
                    field.onChange([...currentInterests, customIndustry])
                  }
                }}
                showCategories={true}
              />

              <div className={cn(
                "p-4 rounded-lg",
                glass("subtle")
              )}>
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Choose from 500+ industries including tech, healthcare, trades (plumber, electrician), services, and more. Or add custom industries.
                </p>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
