"use client"

import React from "react"
import { useFormContext, useFieldArray, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Link as LinkIcon } from "lucide-react"
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

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

const LINK_PLATFORMS = [
  { id: "github", label: "GitHub", icon: GithubIcon },
  { id: "linkedin", label: "LinkedIn", icon: LinkedinIcon },
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
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
          <div className="flex justify-end mt-1.5">
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
