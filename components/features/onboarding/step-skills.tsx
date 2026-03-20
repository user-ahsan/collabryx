"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { InlineSearchableCombobox, ComboboxOption } from "@/components/ui/inline-searchable-combobox"
import { skillsDatabase, type Skill } from "@/lib/data/skills-database"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

export function StepSkills() {
  const { control, formState: { errors } } = useFormContext()

  // Convert skills database to combobox options
  const skillOptions: ComboboxOption[] = React.useMemo(() => 
    skillsDatabase.map((skill: Skill) => ({
      id: skill.id,
      label: skill.name,
      description: skill.subcategory,
      category: skill.category,
      keywords: skill.keywords,
    })),
    []
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 id="step-heading" className="text-3xl font-bold tracking-tight text-foreground">Your Skills</h2>
        <p className="text-base text-muted-foreground">Add your skills to help us match you with the right opportunities. Select from our comprehensive list or add custom skills.</p>
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => {
          const skills = field.value || []

          return (
            <div className="space-y-4" aria-labelledby="step-heading">
              <div className="grid gap-2">
                <Label htmlFor="skills-combobox" className="text-sm font-semibold text-foreground">
                  Add Skills <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <InlineSearchableCombobox
                  options={skillOptions}
                  selected={skills}
                  onChange={(selected) => field.onChange(selected)}
                  searchPlaceholder="Search skills (e.g., React, Python, Plumbing)..."
                  emptyMessage="No skills found. Type to add a custom skill."
                  maxHeight={350}
                  allowCustom={true}
                  onAddCustom={(customSkill) => {
                    if (!skills.includes(customSkill)) {
                      field.onChange([...skills, customSkill])
                    }
                  }}
                  showCategories={true}
                  className="skills-combobox"
                  aria-required="true"
                  aria-invalid={!!errors.skills}
                  aria-describedby={typeof errors.skills?.message === "string" ? "skills-error" : "skills-hint"}
                />
                {typeof errors.skills?.message === "string" && (
                  <p id="skills-error" className="text-xs text-destructive font-medium" role="alert">
                    {errors.skills.message}
                  </p>
                )}
              </div>

              <div className={cn(
                "p-4 rounded-lg",
                glass("subtle")
              )}>
                <p id="skills-hint" className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> You can select from our list of 1000+ skills across all categories including technical, trades, services, creative, and more. Or type to add custom skills not in the list.
                </p>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
