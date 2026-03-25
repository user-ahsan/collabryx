"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { SearchableCombobox, type ComboboxOption } from "@/components/ui/searchable-combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, AlertCircle, CheckCircle, GripVertical, Code2, Sparkles, Plus } from "lucide-react"
import { skillsDatabase, type Skill } from "@/lib/data/skills-database"
import { cn } from "@/lib/utils"

// Role-based skill suggestions database
const ROLE_SKILL_SUGGESTIONS: Record<string, string[]> = {
  "Mobile Developer": ["Swift", "SwiftUI", "Kotlin", "React Native", "Flutter", "iOS Development", "Android Development"],
  "Frontend Developer": ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "Vue.js", "Angular"],
  "Backend Developer": ["Node.js", "Python", "PostgreSQL", "Docker", "AWS", "Express", "FastAPI"],
  "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Next.js", "Docker"],
  "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux", "Python"],
  "Data Scientist": ["Python", "Machine Learning", "SQL", "TensorFlow", "R", "Data Analysis", "Statistics"],
  "Designer": ["Figma", "Adobe XD", "Sketch", "UI/UX Design", "Prototyping", "Design Systems", "Illustrator"],
  "Product Manager": ["Product Strategy", "Agile", "User Research", "Data Analysis", "Roadmapping", "Stakeholder Management"],
}

const POPULAR_SKILLS = ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "Figma", "SQL"]

interface SkillWithProficiency {
  id: string
  label: string
  proficiency?: string
}

export function StepSkills() {
  const { control, formState: { errors }, watch } = useFormContext()
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  
  // Get role from form context
  const role = watch("role") || watch("looking_for")?.[0] || null
  const roleSuggestions = role ? ROLE_SKILL_SUGGESTIONS[role] || POPULAR_SKILLS : POPULAR_SKILLS

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
        <p className="text-base text-muted-foreground mt-1">
          Add your skills to help us match you with the right opportunities. Proficiency level required for each skill.
        </p>
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => {
          const skills: SkillWithProficiency[] = field.value || []
          
          // Filter out skills already added
          const suggestedSkills = roleSuggestions.filter(
            suggestion => !skills.find(s => s.label.toLowerCase() === suggestion.toLowerCase())
          ).slice(0, 5) // Show max 5 suggestions

          return (
            <div className="space-y-4" aria-labelledby="skills-heading">
              {/* Progress Badge */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">
                  Your Skills <span className="text-xs text-muted-foreground font-normal">({skills.length}/5 minimum)</span>
                </Label>
                <div className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                  skills.length >= 5 
                    ? "bg-green-500/20 text-green-500 border border-green-500/30" 
                    : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                )}>
                  {skills.length}/5 {skills.length >= 5 ? '✓' : '✨'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Profile completion</span>
                  <span>{Math.min((skills.length / 5) * 100, 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 ease-out",
                      skills.length >= 5 ? "bg-green-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min((skills.length / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Selected Skills with Integrated Proficiency */}
              {skills.length > 0 && (
                <div className="space-y-3">
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
                  
                  {/* Warning if not enough skills */}
                  {skills.length > 0 && skills.length < 5 && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-500">
                          {5 - skills.length} more skill{5 - skills.length > 1 ? 's' : ''} needed
                        </p>
                        <p className="text-xs text-amber-500/80 mt-0.5">
                          Add at least 5 skills with proficiency levels to continue. This helps us match you with better opportunities.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success message when 5+ skills */}
                  {skills.length >= 5 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-green-500">
                        Great! You have enough skills to get great matches
                      </p>
                    </div>
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

              {/* Role-based Suggestions */}
              {skills.length < 3 && suggestedSkills.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>
                      {role 
                        ? `Based on your role (${role}), consider adding:`
                        : "Popular skills to consider:"
                      }
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map((skill) => (
                      <Button
                        key={skill}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSkill = {
                            id: `suggestion-${skill.toLowerCase().replace(/\s+/g, '-')}`,
                            label: skill,
                            proficiency: "intermediate"
                          }
                          field.onChange([...skills, newSkill])
                        }}
                        className="text-xs h-8"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Empty State */}
              {skills.length === 0 && (
                <div className="p-6 rounded-lg bg-muted/30 border border-border/50 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Code2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">No skills added yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start by adding your top 5 skills from the suggestions below
                    </p>
                  </div>
                </div>
              )}

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
