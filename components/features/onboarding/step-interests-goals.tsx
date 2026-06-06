"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { collaborationGoals } from "@/lib/data/collaboration-goals"
import { industriesDatabase } from "@/lib/data/industries-database"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { TagSelectorCard } from "@/components/features/onboarding/tag-selector-card"
import { CollaborationSelector } from "@/components/shared/collaboration-selector"
import type { ComboboxOption } from "@/components/ui/searchable-combobox"

/**
 * StepInterestsAndGoals - Third data step: collaboration goals + industry interests.
 *
 * FIXES APPLIED:
 *
 * 1. HELPER TEXT IMPROVEMENT — The original text "Select all that apply from the card on
 *    the right" assumed a desktop two-column layout that doesn't exist on mobile (the card
 *    stacks below). Changed to "Search or browse categories below" which accurately
 *    describes the interaction regardless of viewport. Same for the interests section.
 *
 * 2. TIP TEXT CLEANUP — Removed emoji bullet from tip text (💡) for consistency with
 *    the rest of the onboarding flow which uses plain text. Reworded to be more specific
 *    about the value: "Your interests help us match you with relevant opportunities"
 *    instead of vague "Or add custom industries."
 */
export function StepInterestsAndGoals() {
  const { control, watch, setValue, formState: { errors } } = useFormContext()
  const [goalsSearch, setGoalsSearch] = React.useState("")
  const [interestsSearch, setInterestsSearch] = React.useState("")
  const [showAddGoals, setShowAddGoals] = React.useState(false)
  const [showAddInterests, setShowAddInterests] = React.useState(false)



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
        <h2 id="step-heading" className="text-3xl font-bold tracking-tight text-foreground">Interests & Goals</h2>
        <p className="text-base text-muted-foreground">What industries do you care about, and what are you here to do?</p>
      </div>

      {/* Collaboration Goals */}
      <Controller
        control={control}
        name="goals"
        render={({ field }) => {
          const currentGoals: string[] = field.value || []

          const handleRemoveGoal = (id: string) => {
            field.onChange(currentGoals.filter(g => g !== id))
          }

          return (
            <div className="space-y-4 relative" aria-labelledby="step-heading">
              <div className="space-y-1.5">
                <Label htmlFor="goals-input" className="text-sm font-semibold text-foreground">Collaboration Goals <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <p id="goals-hint" className="text-sm text-muted-foreground">Select all that apply — search or browse categories below.</p>
              </div>
              {typeof errors.goals?.message === "string" && (
                <p id="goals-error" className="text-xs text-destructive font-medium" role="alert">{errors.goals.message}</p>
              )}

              {/* Selected goals as badges outside search, always visible */}
              {currentGoals.length > 0 && (
                <div className={cn("flex flex-wrap gap-2 p-3 rounded-lg min-h-[48px]", glass("subtle"))} role="list" aria-label="Selected goals">
                  {currentGoals.map((goalId) => {
                    const goal = goalOptions.find(g => g.id === goalId)
                    return (
                      <Badge key={goalId} variant="secondary" className="px-3 py-1.5 text-sm gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none" role="listitem">
                        {goal?.label || goalId}
                        <button type="button" onClick={() => handleRemoveGoal(goalId)} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors" aria-label={`Remove goal`}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* Add Goal Toggle Button */}
              {!showAddGoals && (
                <div className="flex justify-center pt-1">
                  <Button
                    type="button"
                    onClick={() => setShowAddGoals(true)}
                    className={cn(
                      "w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2",
                      glass("buttonPrimary"),
                      glass("buttonPrimaryGlow")
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    {currentGoals.length > 0 ? "Add More Goals" : "Add Goals"}
                  </Button>
                </div>
              )}

              {/* Add Goals Panel */}
              {showAddGoals && (
                <div className="flex flex-col gap-4 border border-border/20 rounded-2xl p-4 bg-card/25 backdrop-blur-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="goals-input" className="text-sm font-semibold text-foreground">
                      Search & Select Goals
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddGoals(false)}
                      className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
                    >
                      Done Adding
                    </Button>
                  </div>

                  <Input
                    id="goals-input"
                    value={goalsSearch}
                    onChange={(e) => setGoalsSearch(e.target.value)}
                    placeholder="Search goals (e.g., Find Co-Founder, Networking)..."
                    className={cn("h-12 text-base", glass("input"))}
                  />

                  <div className="min-h-[250px] lg:min-h-[350px]">
                      <TagSelectorCard
                        options={goalOptions}
                        selected={currentGoals}
                        onChange={(selected) => field.onChange(selected)}
                        searchValue={goalsSearch}
                        onSearchChange={setGoalsSearch}
                        searchPlaceholder="Search goals..."
                        emptyMessage="No goals match your search."
                        title="Collaboration Goals"
                        showCategories={true}
                        maxHeight={350}
                      />
                  </div>
                </div>
              )}

                  <div className={cn(
                    "p-4 rounded-lg",
                    glass("subtle")
                  )}>
                    <p className="text-sm text-muted-foreground">
                      <strong>Tip:</strong> Select goals that match what you&apos;re looking for — from finding co-founders to networking, mentorship, freelance work, and more.
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
          const currentInterests: string[] = field.value || []

          const handleRemoveInterest = (id: string) => {
            field.onChange(currentInterests.filter(i => i !== id))
          }

          return (
            <div className="space-y-4 pt-6 border-t border-border/20">
              <div className="space-y-1.5">
                <Label htmlFor="interests-input" className="text-sm font-semibold text-foreground">
                  Your Interests / Industries <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <p id="interests-hint" className="text-sm text-muted-foreground">Pick industries you care about — search or browse categories below.</p>
              </div>
              
              {/* Selected interests as badges outside search, always visible */}
              {currentInterests.length > 0 && (
                <div className={cn("flex flex-wrap gap-2 p-3 rounded-lg min-h-[48px]", glass("subtle"))} role="list" aria-label="Selected interests">
                  {currentInterests.map((interestId) => {
                    const industry = industryOptions.find(i => i.id === interestId)
                    return (
                      <Badge key={interestId} variant="secondary" className="px-3 py-1.5 text-sm gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none" role="listitem">
                        {industry?.label || interestId}
                        <button type="button" onClick={() => handleRemoveInterest(interestId)} className="p-0.5 rounded-full hover:bg-primary/20 transition-colors" aria-label={`Remove interest`}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* Add Interest Toggle Button */}
              {!showAddInterests && (
                <div className="flex justify-center pt-1">
                  <Button
                    type="button"
                    onClick={() => setShowAddInterests(true)}
                    className={cn(
                      "w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2",
                      glass("buttonPrimary"),
                      glass("buttonPrimaryGlow")
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    {currentInterests.length > 0 ? "Add More Interests" : "Add Interests"}
                  </Button>
                </div>
              )}

              {/* Add Interests Panel */}
              {showAddInterests && (
                <div className="flex flex-col gap-4 border border-border/20 rounded-2xl p-4 bg-card/25 backdrop-blur-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="interests-input" className="text-sm font-semibold text-foreground">
                      Search & Select Industries
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddInterests(false)}
                      className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
                    >
                      Done Adding
                    </Button>
                  </div>

                  <Input
                    id="interests-input"
                    value={interestsSearch}
                    onChange={(e) => setInterestsSearch(e.target.value)}
                    placeholder="Search industries (e.g., Technology, Healthcare)..."
                    className={cn("h-12 text-base", glass("input"))}
                    aria-required="true"
                  />

                  <div className="min-h-[250px] lg:min-h-[400px]">
                    <TagSelectorCard
                      options={industryOptions}
                      selected={currentInterests}
                      onChange={(selected) => field.onChange(selected)}
                      searchValue={interestsSearch}
                      onSearchChange={setInterestsSearch}
                      searchPlaceholder="Search industries..."
                      emptyMessage="No industries match your search."
                      title="Industries & Interests"
                      showCategories={true}
                      maxHeight={400}
                    />
                  </div>
                </div>
              )}

                  <div className={cn(
                    "p-4 rounded-lg",
                    glass("subtle")
                  )}>
                    <p className="text-sm text-muted-foreground">
                      <strong>Tip:</strong> Choose from 500+ industries — tech, healthcare, trades, services, and more. Your interests help us match you with relevant opportunities.
                    </p>
                  </div>
            </div>
          )
        }}
      />

      {/* Collaboration Readiness - NEW */}
      <div className="pt-6 border-t border-border/20">
        <CollaborationSelector
          value={watch("collaborationReadiness") || "available"}
          onChange={(val) => setValue("collaborationReadiness", val, { shouldDirty: true, shouldValidate: true })}
        />
      </div>
    </div>
  )
}
