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

// Memoized skills list component to prevent re-renders
const SkillsList = React.memo(({ 
  skills, 
  onRemove, 
  onProficiencyChange,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd
}: {
  skills: SkillWithProficiency[]
  onRemove: (id: string) => void
  onProficiencyChange: (id: string, index: number, val: string) => void
  draggedIndex: number | null
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
}) => {
  return (
    <div className="grid gap-2" style={{ contain: 'layout' }}>
      {skills.map((skill, index) => (
        <div
          key={skill.id}
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => {
            e.preventDefault()
            onDragOver(index)
          }}
          onDragEnd={onDragEnd}
          className={cn(
            "flex flex-col md:flex-row md:items-center gap-3 md:gap-2 p-4 md:p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 transition-colors duration-200 cursor-grab active:cursor-grabbing",
            draggedIndex === index && "opacity-60"
          )}
        >
          {/* Drag handle - larger touch target on mobile */}
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Drag to reorder"
            tabIndex={-1}
          >
            <GripVertical className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
          </button>
          
          {/* Priority number */}
          <span className="text-xs text-muted-foreground w-5 text-center font-medium">
            {index + 1}
          </span>
          
          {/* Skill name - full width on mobile */}
          <span className="text-sm md:text-base font-medium w-full md:flex-1 min-w-0 truncate break-words max-w-full">
            {skill.label}
          </span>
          
          {/* Proficiency selector - full width on mobile */}
          <Select
            value={skill.proficiency || "intermediate"}
            onValueChange={(value) => {
              onProficiencyChange(skill.id, index, value)
            }}
          >
            <SelectTrigger className="w-full md:w-[140px] h-10 md:h-9 text-xs md:text-sm bg-background/30">
              <SelectValue placeholder="Select proficiency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Remove button - larger touch target on mobile */}
          <button
            type="button"
            onClick={() => {
              onRemove(skill.id)
            }}
            className="p-2 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-200"
            aria-label={`Remove ${skill.label}`}
          >
            <X className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      {/* Mobile drag hint */}
      {skills.length > 1 && (
        <p className="text-xs text-muted-foreground md:hidden flex items-center gap-1.5 mt-2">
          <GripVertical className="w-3.5 h-3.5" />
          Swipe up/down on skill to reorder priority
        </p>
      )}
    </div>
  )
})
SkillsList.displayName = 'SkillsList'

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
  
  const handleDragEnd = () => setDraggedIndex(null)

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Your Skills</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
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

          // Handler functions for SkillsList
          const handleRemoveSkill = (id: string) => {
            const newSkills = skills.filter(s => s.id !== id)
            field.onChange(newSkills)
          }
          
          const handleProficiencyChange = (id: string, index: number, value: string) => {
            const newSkills = [...skills]
            newSkills[index] = { ...skills[index], proficiency: value }
            field.onChange(newSkills)
          }
          
          const handleDragOverWithUpdate = (index: number) => {
            if (draggedIndex === null || draggedIndex === index) return
            const newSkills = [...skills]
            const dragged = newSkills[draggedIndex]
            newSkills.splice(draggedIndex, 1)
            newSkills.splice(index, 0, dragged)
            field.onChange(newSkills)
            setDraggedIndex(index)
          }

          return (
            <div className="space-y-4" aria-labelledby="skills-heading">
              {/* Progress Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Label className="text-sm font-semibold text-foreground">
                  Your Skills <span className="text-xs text-muted-foreground font-normal">({skills.length}/5 minimum)</span>
                </Label>
                <div className={cn(
                  "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-200",
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
                      "h-full transition-all duration-200 ease-out",
                      skills.length >= 5 ? "bg-green-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min((skills.length / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Selected Skills with Integrated Proficiency - Hide when empty */}
              {skills.length > 0 && (
                <div className="space-y-3 md:space-y-4" style={{ contain: 'layout', willChange: 'auto' }}>
                  <SkillsList
                    skills={skills}
                    onRemove={handleRemoveSkill}
                    onProficiencyChange={handleProficiencyChange}
                    draggedIndex={draggedIndex}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOverWithUpdate}
                    onDragEnd={handleDragEnd}
                  />
                  
                  {/* Warning if any skill missing proficiency */}
                  {skills.some(s => !s.proficiency) && (
                    <p className="text-xs text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Please set proficiency for all skills
                    </p>
                  )}
                  
                  {/* Warning if not enough skills */}
                  {skills.length > 0 && skills.length < 5 && (
                    <div className="p-3 md:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm md:text-base font-medium text-amber-500">
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
                    <div className="p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0" />
                      <p className="text-sm md:text-base font-medium text-green-500">
                        Great! You have enough skills to get great matches
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Add Skills Combobox - Fixed position container to prevent jumping */}
              <div className="grid gap-2" style={{ contain: 'layout', willChange: 'auto' }}>
                <Label htmlFor="skills-combobox" className="text-sm md:text-base font-semibold text-foreground">
                  {skills.length > 0 ? "Add more skills" : "Add Skills"} <span className="text-destructive">*</span>
                </Label>
                
                {/* Stable container with fixed minimum height to prevent layout shift */}
                <div className="relative min-h-[56px]" style={{ position: 'relative', contain: 'layout' }}>
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
                    className="skills-combobox w-full"
                    aria-required="true"
                    aria-invalid={!!errors.skills}
                  />
                </div>

                {typeof errors.skills?.message === "string" && (
                  <p className="text-xs md:text-sm text-destructive font-medium" role="alert">
                    {errors.skills.message}
                  </p>
                )}
              </div>

              {/* Role-based Suggestions - Hide when empty (enhanced empty state shows instead) */}
              {skills.length > 0 && skills.length < 3 && suggestedSkills.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                    <span>
                      {role 
                        ? `Based on your role (${role}), consider adding:`
                        : "Popular skills to consider:"
                      }
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-w-full">
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
                        className="text-xs md:text-sm h-9 md:h-8 min-h-[44px]"
                      >
                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                        <span className="truncate max-w-[150px] md:max-w-none">{skill}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Empty State - Show when no skills added */}
              {skills.length === 0 && (
                <div className="p-6 md:p-8 rounded-xl bg-gradient-to-b from-muted/30 to-muted/20 border border-border/30 text-center space-y-4 md:space-y-6">
                  {/* Icon */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Code2 className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  
                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base md:text-lg font-semibold text-foreground">No skills added yet</h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">
                      Start by adding your top 5 skills. This helps us match you with the right opportunities and collaborators.
                    </p>
                  </div>
                  
                  {/* Guidance Cards */}
                  <div className="grid gap-3 max-w-md mx-auto">
                    <div className="p-3 md:p-4 rounded-lg bg-background/30 border border-border/30 text-left flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-500">1</span>
                      </div>
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">What do you use most often?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your daily tools and technologies</p>
                      </div>
                    </div>
                    
                    <div className="p-3 md:p-4 rounded-lg bg-background/30 border border-border/30 text-left flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-500">2</span>
                      </div>
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">What are you best at?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your strongest expertise areas</p>
                      </div>
                    </div>
                    
                    <div className="p-3 md:p-4 rounded-lg bg-background/30 border border-border/30 text-left flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-500">3</span>
                      </div>
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">What do you want to be hired for?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your target role or projects</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Start CTA */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Or start with popular skills:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-full">
                      {["React", "TypeScript", "Python", "Node.js"].map((skill) => (
                        <Button
                          key={skill}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSkill = {
                              id: `quick-${skill.toLowerCase()}`,
                              label: skill,
                              proficiency: "intermediate"
                            }
                            field.onChange([newSkill])
                          }}
                          className="text-xs md:text-sm h-9 md:h-8 min-h-[44px]"
                        >
                          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                          <span className="truncate max-w-[120px] md:max-w-none">{skill}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Helper Text */}
              <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs md:text-sm text-muted-foreground">
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
