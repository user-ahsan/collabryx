"use client"

import React from "react"
import { useFormContext, useFieldArray, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Github, Linkedin, Instagram, Link as LinkIcon, Sparkles } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InlineSearchableCombobox, ComboboxOption } from "@/components/ui/inline-searchable-combobox"
import { jobTitlesDatabase } from "@/lib/data/job-titles-database"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

const LINK_PLATFORMS = [
  { id: "github", label: "GitHub", icon: Github },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "portfolio", label: "Portfolio / Website", icon: LinkIcon }
]

/**
 * StepExperience - Final step: work experience entries + portfolio/social links.
 *
 * FIXES APPLIED:
 *
 * 1. REMOVED UNUSED onSkip PROP — The component interface declared an `onSkip` callback
 *    prop that was destructured as `{}` (unused) in the function body. The skip logic is
 *    handled entirely by the parent (`handleSkipExperience` in `onboarding-content.tsx`)
 *    which calls the server action directly with empty experiences/links arrays. Having
 *    an unused prop in the interface is misleading to future developers and adds
 *    unnecessary noise. Removed it entirely.
 *
 * 2. BETTER EMPTY STATES — The original empty state messages were singular sentence
 *    fragments ("No experiences added yet. Click 'Add Experience' to begin.") that
 *    didn't give the user context about why they should add experiences or what kinds
 *    of entries are appropriate. Added a secondary line of guidance text describing
 *    accepted content types ("past roles, projects, or volunteer work" / "Link your
 *    GitHub, LinkedIn, portfolio").
 */
export function StepExperience() {
  const { register, control, watch, formState: { errors } } = useFormContext()
  const bioValue = watch("bio")

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experiences"
  })

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: "links"
  })

  // Type-safe error accessors
  const getExperienceError = (index: number) => {
    if (!errors.experiences || !Array.isArray(errors.experiences)) return undefined
    return errors.experiences[index]
  }
  
  const getLinkError = (index: number) => {
    if (!errors.links || !Array.isArray(errors.links)) return undefined
    return errors.links[index]
  }

  // Convert job titles database to combobox options
  const jobTitleOptions: ComboboxOption[] = React.useMemo(() => 
    jobTitlesDatabase.map(job => ({
      id: job.id,
      label: job.title,
      description: job.subcategory,
      category: job.category,
      keywords: job.keywords,
    })),
    []
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Experience & Projects</h2>
        <p className="text-base text-muted-foreground">Add your experiences and link your portfolios.</p>
      </div>

      <div className="space-y-8">
        {/* Bio Section - NEW */}
        <div>
          <div className="space-y-2 mb-4">
            <Label htmlFor="bio" className="text-sm font-semibold text-foreground">
              Tell your story <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              A short bio helps AI match you with the right collaborators.
            </p>
          </div>

          <Textarea
            id="bio"
            placeholder="e.g., I'm a full-stack developer passionate about edtech. I've built 3 startups and I'm looking for a technical co-founder to scale my latest project..."
            {...register("bio", {
              maxLength: {
                value: 2000,
                message: "Bio must be less than 2000 characters"
              }
            })}
            className={cn(
              "min-h-[100px] resize-none text-sm",
              glass("input"),
              errors.bio && "border-destructive focus:border-destructive"
            )}
            aria-invalid={!!errors.bio}
          />
          {errors.bio?.message && (
            <p className="text-xs text-destructive font-medium mt-1" role="alert">
              {errors.bio.message as string}
            </p>
          )}
          <div className="flex justify-between items-center mt-1.5">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 max-w-md">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">AI Tip:</span> A detailed bio increases profile views by 3x and helps us match you with the right collaborators.
              </p>
            </div>
            <span className={cn(
              "text-xs tabular-nums",
              (bioValue?.length || 0) > 1800 ? "text-amber-500" : "text-muted-foreground"
            )}>
              {bioValue?.length || 0}/2000
            </span>
          </div>
        </div>

        {/* Experiences Section */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-3">
            <h3 id="experiences-heading" className="text-sm font-semibold text-foreground">Experiences (Optional)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendExp({ title: "", company: "", description: "" })}
              className="gap-2 h-9 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Add a new experience"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> 
              <span className="hidden sm:inline">Add Experience</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          <div className="space-y-4">
            {expFields.length === 0 && (
              <div className={cn(
                "text-center py-8 px-4 rounded-lg border border-dashed",
                glass("subtle")
              )}>
                <p className="text-sm text-muted-foreground">No experiences added yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Add past roles, projects, or volunteer work — or skip and do it later.
                </p>
              </div>
            )}
            {expFields.map((field, index) => (
              <GlassCard key={field.id} className="relative transition-all duration-300 p-4 sm:p-5" innerClassName="relative z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors z-20"
                  onClick={() => removeExp(index)}
                  aria-label={`Remove experience ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>

                <div className="space-y-4">
                  <div className="grid gap-2 relative">
                    <Label htmlFor={`experiences.${index}.title`} className="text-sm font-semibold text-foreground">Job Title / Role</Label>
                    <Controller
                      control={control}
                      name={`experiences.${index}.title` as const}
                      render={({ field: titleField }) => (
                        <InlineSearchableCombobox
                          options={jobTitleOptions}
                          selected={titleField.value ? [titleField.value] : []}
                          onChange={(selected: string[]) => titleField.onChange(selected[0] || "")}
                          searchPlaceholder="Search job titles (e.g., Software Engineer, Plumber, Teacher)..."
                          emptyMessage="No job titles found. Type to add custom."
                          maxHeight={300}
                          allowCustom={true}
                          onAddCustom={(customTitle: string) => {
                            titleField.onChange(customTitle)
                          }}
                          showCategories={true}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`experiences.${index}.company`} className="text-sm font-semibold text-foreground">Company / Organization</Label>
                    <Input
                      id={`experiences.${index}.company`}
                      placeholder="e.g. TechStart Inc."
                      {...register(`experiences.${index}.company`, {
                        minLength: {
                          value: 2,
                          message: "Company name must be at least 2 characters"
                        },
                        maxLength: {
                          value: 100,
                          message: "Company name must be less than 100 characters"
                        }
                      })}
                      className={cn(
                        "h-11 text-sm",
                        glass("input"),
                        getExperienceError(index)?.company && "border-destructive focus:border-destructive"
                      )}
                    />
                    {getExperienceError(index)?.company?.message && (
                      <p className="text-xs text-destructive font-medium">{getExperienceError(index)!.company!.message as string}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`experiences.${index}.description`} className="text-sm font-semibold text-foreground">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Textarea
                      id={`experiences.${index}.description`}
                      placeholder="What did you do? (Optional)"
                      className={cn(
                        "resize-none min-h-[80px] text-sm",
                        glass("input")
                      )}
                      {...register(`experiences.${index}.description`, {
                        maxLength: {
                          value: 2000,
                          message: "Description must be less than 2000 characters"
                        }
                      })}
                    />
                    {getExperienceError(index)?.description?.message && (
                      <p className="text-xs text-destructive font-medium">{getExperienceError(index)!.description!.message as string}</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Portfolios / Links Section */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-3">
            <div>
              <h3 id="links-heading" className="text-sm font-semibold text-foreground">Portfolio & Links (Optional)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add your work experience and portfolio links.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 px-3"
                  aria-label="Add a new portfolio link"
                  aria-expanded="false"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Add Link</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-56", glass("dropdown"))} role="menu">
                {LINK_PLATFORMS.map((platform) => (
                  <DropdownMenuItem
                    key={platform.id}
                    className={cn(
                      "gap-3 cursor-pointer py-2.5",
                      glass("dropdownItem")
                    )}
                    onClick={() => appendLink({ platform: platform.id, url: "" })}
                    role="menuitem"
                  >
                    <platform.icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">{platform.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            {linkFields.length === 0 && (
              <div className={cn(
                "text-center py-8 px-4 rounded-lg border border-dashed",
                glass("subtle")
              )}>
                <p className="text-sm text-muted-foreground">No links added yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Link your GitHub, LinkedIn, portfolio, or other profiles.
                </p>
              </div>
            )}
            {linkFields.map((field, index) => {
              const platformId = "platform" in field ? (field.platform as string) || "portfolio" : "portfolio"
              const platform = LINK_PLATFORMS.find(p => p.id === platformId) || LINK_PLATFORMS[3]
              const Icon = platform.icon
              const linkError = getLinkError(index)
              const currentError = linkError?.url?.message

              return (
                <div key={field.id} className="flex gap-2 items-start relative group">
                  <input type="hidden" {...register(`links.${index}.platform` as const)} defaultValue={platformId} />
                  <div className="flex-1 grid gap-2">
                    <div className="relative flex items-center">
                      <div className={cn(
                        "absolute left-3 flex items-center justify-center p-1.5 rounded-md",
                        glass("subtle")
                      )}>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Input
                        id={`links.${index}.url`}
                        placeholder={`https://${platform.id}.com/username`}
                        {...register(`links.${index}.url`, {
                          pattern: {
                            value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/,
                            message: "Please enter a valid URL"
                          }
                        })}
                        className={cn(
                          "h-11 text-sm pl-11",
                          glass("input"),
                          currentError && "border-destructive focus:border-destructive"
                        )}
                      />
                    </div>
                    {typeof currentError === "string" && (
                      <p className="text-xs text-destructive font-medium">{currentError}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => removeLink(index)}
                    aria-label={`Remove ${platform.label} link`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
