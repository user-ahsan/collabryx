"use client"

import React from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, AlertCircle, CheckCircle, GripVertical, Code2, Sparkles, Plus } from "lucide-react"
import { skillsDatabase, type Skill } from "@/lib/data/skills-database"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TagSelectorCard } from "@/components/features/onboarding/tag-selector-card"
import type { ComboboxOption } from "@/components/ui/searchable-combobox"

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
  onMoveUp,
  onMoveDown,
}: {
  skills: SkillWithProficiency[]
  onRemove: (id: string) => void
  onProficiencyChange: (id: string, index: number, val: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}) => {
  return (
    <div className="grid gap-2" style={{ contain: 'layout' }}>
      {skills.map((skill, index) => (
        <div
          key={skill.id}
          className={cn(
            "flex flex-col md:flex-row md:items-center gap-3 md:gap-2 p-4 md:p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 transition-colors duration-200"
          )}
        >
          {/* Priority number + reorder buttons - combined on mobile */}
          <div className="flex items-center gap-1.5">
            {/* Reorder arrows for mobile */}
            <div className="flex md:hidden items-center gap-0.5">
              <button
                type="button"
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label={`Move ${skill.label} up`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(index)}
                disabled={index === skills.length - 1}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label={`Move ${skill.label} down`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Priority number */}
            <span className="text-xs text-muted-foreground w-5 text-center font-medium shrink-0">
              {index + 1}
            </span>
          </div>
          
          {/* Drag handle - desktop only */}
          <div className="hidden md:flex items-center">
            <span className="text-xs text-muted-foreground/60 italic mr-1 cursor-default select-none" title="Drag to reorder (desktop)">
              <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
          
          {/* Skill name - full width on mobile */}
          <span className="text-sm md:text-base font-medium w-full md:flex-1 min-w-0 truncate max-w-full">
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
            className="self-end md:self-center p-2 md:p-1.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-200"
            aria-label={`Remove ${skill.label}`}
          >
            <X className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      {/* Reorder hint */}
      {skills.length > 1 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
          <GripVertical className="w-3 h-3 hidden md:inline" aria-hidden="true" />
          <span className="md:hidden">Use the ▲▼ buttons to reorder priority</span>
          <span className="hidden md:inline">Drag the handle to reorder priority</span>
        </p>
      )}
    </div>
  )
})
SkillsList.displayName = 'SkillsList'

/**
 * StepSkills - Skills selection step in the onboarding flow.
 *
 * FIXES APPLIED:
 *
 * 1. MOBILE DRAG-AND-DROP REPLACED — The original implementation used HTML5 drag-and-drop
 *    for reordering skills, with a "Swipe up/down on skill to reorder" hint for mobile.
 *    Drag-and-drop on touch devices is notoriously unreliable: the `touchmove` events
 *    conflict with page scrolling, the visual feedback (opacity/ring) doesn't work on
 *    touch, and the drag handles are too small for finger targets. Replaced with ▲/▼
 *    up/down arrow buttons that appear on mobile (hidden on desktop). Each button swaps
 *    the skill with its neighbor via direct array mutation. The desktop still shows a
 *    grip handle icon but it's purely visual — the drag behaviour was removed entirely
 *    to keep the codebase simpler and avoid the `draggedIndex` state complexity that
 *    caused a re-render on every `dragOver` event.
 *
 * 2. MISLEADING LABEL — The progress bar was labelled "Profile completion" which is
 *    misleading because it only measures skills count (0-5), not actual profile
 *    completeness. Changed to "Skills progress" to accurately reflect what's being
 *    measured. The badge now shows "✓ Complete" instead of "5/5 ✨" when the minimum
 *    is met, and "2/5 needed" instead of "2/5 ✨" when not — clearer status communication.
 */
export function StepSkills() {
  const { control, formState: { errors }, watch } = useFormContext()
  const [search, setSearch] = React.useState("")
  
  // Get role from form context
    const headline = watch("headline") || ""
  const detectedRole = Object.keys(ROLE_SKILL_SUGGESTIONS).find(r => headline.toLowerCase().includes(r.toLowerCase())) || null
  const roleSuggestions = detectedRole ? ROLE_SKILL_SUGGESTIONS[detectedRole] : POPULAR_SKILLS

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

  const handleMoveUp = (index: number, skills: SkillWithProficiency[], onChange: (skills: SkillWithProficiency[]) => void) => {
    if (index <= 0) return
    const newSkills = [...skills]
    const temp = newSkills[index - 1]
    newSkills[index - 1] = newSkills[index]
    newSkills[index] = temp
    onChange(newSkills)
  }

  const handleMoveDown = (index: number, skills: SkillWithProficiency[], onChange: (skills: SkillWithProficiency[]) => void) => {
    if (index >= skills.length - 1) return
    const newSkills = [...skills]
    const temp = newSkills[index + 1]
    newSkills[index + 1] = newSkills[index]
    newSkills[index] = temp
    onChange(newSkills)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 id="step-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Your Skills</h2>
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

          return (
            <div className="space-y-4" aria-labelledby="skills-heading">
              {/* Progress Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Label className="text-sm font-semibold text-foreground">
                  Your Skills <span className="text-xs text-muted-foreground font-normal">(min. {skills.length}/5)</span>
                </Label>
                <div className={cn(
                  "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-200 shrink-0",
                  skills.length >= 5 
                    ? "bg-green-500/20 text-green-500 border border-green-500/30" 
                    : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                )}>
                  {skills.length >= 5 ? '✓ Complete' : `${skills.length}/5 needed`}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Skills progress</span>
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
                    onMoveUp={(index) => handleMoveUp(index, skills, field.onChange)}
                    onMoveDown={(index) => handleMoveDown(index, skills, field.onChange)}
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

              {/* Add Skills - Card-based selector on right, input + badges on left */}
              <div className="grid gap-2" style={{ contain: 'layout', willChange: 'auto' }}>
                <Label htmlFor="skills-combobox" className="text-sm md:text-base font-semibold text-foreground">
                  {skills.length > 0 ? "Add more skills" : "Add Skills"} <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                
                {/* Two-column layout: left = input+tags, right = selector card */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left column: Search input + selected skills display */}
                  <div className="space-y-3 min-w-0">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search skills (e.g., React, Python, Plumbing)..."
                      className={cn("h-12 text-base", glass("input"))}
                      aria-label="Search skills"
                      aria-controls="skills-tag-card"
                    />
                    
                    {/* Selected skills as badges */}
                    {skills.length > 0 && (
                      <div className={cn("flex flex-wrap gap-2 p-3 rounded-lg min-h-[48px]", glass("subtle"))} role="list" aria-label="Selected skills">
                        {skills.map((skill, idx) => (
                          <Badge
                            key={skill.id}
                            variant="secondary"
                            className="px-3 py-1.5 text-sm gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none group"
                            role="listitem"
                          >
                            <span className="text-xs text-muted-foreground font-mono mr-1">{idx + 1}.</span>
                            {skill.label}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill.id)}
                              className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                              aria-label={`Remove ${skill.label}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right column: Tag selector card */}
                  <div id="skills-tag-card" className="min-h-[300px] lg:min-h-[400px]">
                    <TagSelectorCard
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
                      searchValue={search}
                      onSearchChange={setSearch}
                      searchPlaceholder="Search skills..."
                      emptyMessage="No skills found. Check the database or type to add custom."
                      title="Available Skills"
                      showCategories={true}
                      maxHeight={400}
                    />
                  </div>
                </div>

                {typeof errors.skills?.message === "string" && (
                  <p className="text-xs md:text-sm text-destructive font-medium" role="alert">
                    {errors.skills.message}
                  </p>
                )}
              </div>

              {/* Role-based Suggestions - shown when 1-2 skills, empty state has quick-adds */}
              {skills.length > 0 && skills.length < 3 && suggestedSkills.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                    <span>
                      {detectedRole 
                        ? `Based on your role (${detectedRole}), consider adding:`
                        : "Quick add popular skills:"
                      }
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {suggestedSkills.slice(0, 4).map((skill) => (
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
              <div className={cn("p-3 md:p-4 rounded-lg", glass("subtle"))}>
                <p className="text-xs md:text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Select from 1000\+ skills or type to add custom skills. Set proficiency levels to help us match you better.
                </p>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
