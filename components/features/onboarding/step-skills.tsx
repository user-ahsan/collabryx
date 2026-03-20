"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { SearchableCombobox, ComboboxOption } from "@/components/ui/searchable-combobox"
import { skillsDatabase, type Skill } from "@/lib/data/skills-database"

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
    <div className="space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Your Skills</h2>
        <p className="text-lg text-muted-foreground">Add your skills to help us match you with the right opportunities. Select from our comprehensive list or add custom skills.</p>
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => {
          const skills = field.value || []

          return (
            <div className="space-y-5">
              <div className="grid gap-2.5">
                <Label htmlFor="skills" className="text-base font-medium">Add Skills</Label>
                <SearchableCombobox
                  options={skillOptions}
                  selected={skills}
                  onChange={(selected) => field.onChange(selected)}
                  placeholder="Select skills..."
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
                />
                {typeof errors.skills?.message === "string" && (
                  <p className="text-sm text-destructive">{errors.skills.message}</p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> You can select from our list of 10,000+ skills across all categories including technical, trades, services, creative, and more. Or type to add custom skills not in the list.
                </p>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
