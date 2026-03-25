"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, AlertCircle, GripVertical } from "lucide-react"
import { skillsDatabase, type Skill } from "@/lib/data/skills-database"
import { cn } from "@/lib/utils"

interface SkillWithProficiency {
  id: string
  label: string
  proficiency?: string
}

export function StepSkills() {
  const { control, formState: { errors } } = useFormContext()
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)

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

  const handleDragStart = (index: number) => setDraggedIndex(index)
  
  const handleDragOver = (index: number, skills: SkillWithProficiency[], onChange: (value: SkillWithProficiency[]) => void) => {
    if (draggedIndex === null || draggedIndex === index) return
    const newSkills = [...skills]
    const dragged = newSkills[draggedIndex]
    newSkills.splice(draggedIndex, 1)
    newSkills.splice(index, 0, dragged)
    onChange(newSkills)
    setDraggedIndex(index)
  }
  
  const handleDragEnd = () => setDraggedIndex(null)

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
              {/* Selected Skills with Integrated Proficiency */}
              {skills.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground">
                    Your Skills <span className="text-xs text-muted-foreground font-normal">({skills.length}/5 minimum)</span>
                  </Label>
                  
                  <div className="grid gap-2">
                    {skills.map((skill, index) => (
                      <div
                        key={skill.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          handleDragOver(index, skills, field.onChange)
                        }}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/50 hover:border-border/80 transition-all cursor-grab active:cursor-grabbing",
                          draggedIndex === index && "opacity-50 scale-[0.98]"
                        )}
                      >
                        {/* Drag handle */}
                        <button
                          type="button"
                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Drag to reorder"
                          tabIndex={-1}
                        >
                          <GripVertical className="w-4 h-4" aria-hidden="true" />
                        </button>
                        
                        {/* Priority number */}
                        <span className="text-xs text-muted-foreground w-5 text-center font-medium">
                          {index + 1}
                        </span>
                        
                        {/* Skill name */}
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">
                          {skill.label}
                        </span>
                        
                        {/* Proficiency selector */}
                        <Select
                          value={skill.proficiency || "intermediate"}
                          onValueChange={(value) => {
                            const newSkills = [...skills]
                            newSkills[index] = { ...skill, proficiency: value }
                            field.onChange(newSkills)
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50">
                            <SelectValue placeholder="Select proficiency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = skills.filter(s => s.id !== skill.id)
                            field.onChange(newSkills)
                          }}
                          className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove ${skill.label}`}
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Warning if any skill missing proficiency */}
                  {skills.some(s => !s.proficiency) && (
                    <p className="text-xs text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Please set proficiency for all skills
                    </p>
                  )}
                  
                  {/* Show count vs minimum */}
                  {skills.length < 5 && (
                    <p className="text-xs text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Add {5 - skills.length} more skill{5 - skills.length > 1 ? 's' : ''} to continue
                    </p>
                  )}
                </div>
              )}

              {/* Add Skills Combobox */}
              <div className="grid gap-2">
                <Label htmlFor="skills-combobox" className="text-sm font-semibold text-foreground">
                  {skills.length > 0 ? "Add more skills" : "Add Skills"} <span className="text-destructive">*</span>
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
