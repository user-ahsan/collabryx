"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { skillsDatabase, type Skill } from "@/lib/data/skills-database"

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
]

interface SkillWithProficiency {
  id: string
  label: string
  proficiency?: string
}

export function StepSkills() {
  const { control, formState: { errors } } = useFormContext()

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
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Your Skills</h2>
        <p className="text-base text-muted-foreground">Add your skills to help us match you with the right opportunities.</p>
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => {
          const skills: SkillWithProficiency[] = field.value || []

          return (
            <div className="space-y-4" aria-labelledby="skills-heading">
              {/* Add Skills Combobox */}
              <div className="grid gap-2">
                <Label htmlFor="skills-combobox" className="text-sm font-semibold text-foreground">
                  Add Skills <span className="text-destructive">*</span>
                </Label>
                
                <SearchableCombobox
                  options={skillOptions}
                  selected={skills.map(s => s.id)}
                  onChange={(selectedIds) => {
                    const newSkills = selectedIds.map((id) => {
                      const existing = skills.find(s => s.id === id)
                      const option = skillOptions.find(opt => opt.id === id)
                      return {
                        id,
                        label: option?.label || id,
                        proficiency: existing?.proficiency || "intermediate",
                      }
                    })
                    field.onChange(newSkills)
                  }}
                  searchPlaceholder="Search skills (e.g., React, Python, Plumbing)..."
                  emptyMessage="No skills found. Type to add a custom skill."
                  maxHeight={350}
                  allowCustom={true}
                  onAddCustom={(customSkill) => {
                    if (!skills.find(s => s.label === customSkill)) {
                      field.onChange([...skills, { id: `custom-${customSkill}`, label: customSkill, proficiency: "intermediate" }])
                    }
                  }}
                  showCategories={true}
                  className="skills-combobox"
                  aria-required="true"
                  aria-invalid={!!errors.skills}
                />

                {/* Proficiency for each skill */}
                {skills.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-semibold text-foreground">Proficiency Levels</Label>
                    {skills.map((skill, index) => (
                      <div key={skill.id} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-32 truncate">{skill.label}</span>
                        <Select
                          value={skill.proficiency || "intermediate"}
                          onValueChange={(value) => {
                            const newSkills = [...skills]
                            newSkills[index] = { ...skill, proficiency: value }
                            field.onChange(newSkills)
                          }}
                        >
                          <SelectTrigger className="w-[180px] bg-background/40 backdrop-blur-md">
                            <SelectValue placeholder="Select proficiency" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFICIENCY_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = skills.filter(s => s.id !== skill.id)
                            field.onChange(newSkills)
                          }}
                          className="p-1 rounded-md hover:bg-red-500/20 transition-colors text-muted-foreground hover:text-red-400"
                          aria-label={`Remove ${skill.label}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {typeof errors.skills?.message === "string" && (
                  <p className="text-xs text-destructive font-medium" role="alert">
                    {errors.skills.message}
                  </p>
                )}
              </div>

              {/* Helper Text */}
              <div className="p-4 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/50">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Select from 1000+ skills or type to add custom skills. Set proficiency levels to help us match you better.
                </p>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
