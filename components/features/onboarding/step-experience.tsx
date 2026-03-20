"use client"

import React from "react"
import { useFormContext, useFieldArray, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Github, Linkedin, Instagram, Link as LinkIcon } from "lucide-react"
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

interface StepExperienceProps {
  onSkip?: () => void
}

export function StepExperience({}: StepExperienceProps) {
  const { register, control, formState: { errors } } = useFormContext()

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experiences"
  })

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: "links"
  })

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
        {/* Experiences Section */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-3">
            <h3 className="text-sm font-semibold text-foreground">Experiences (Optional)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendExp({ title: "", company: "", description: "" })}
              className="gap-2 h-9 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" /> 
              <span className="hidden sm:inline">Add Experience</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          <div className="space-y-4">
            {expFields.length === 0 && (
              <div className={cn(
                "text-center py-8 rounded-lg border border-dashed",
                glass("subtle")
              )}>
                <p className="text-sm text-muted-foreground">
                  No experiences added yet. Click &quot;Add Experience&quot; to begin.
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
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div className="space-y-4">
                  <div className="grid gap-2">
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
                        required: "Company name is required",
                        minLength: {
                          value: 2,
                          message: "Company name must be at least 2 characters"
                        }
                      })}
                      className={cn(
                        "h-11 text-sm",
                        glass("input"),
                        (errors.experiences as any)?.[index]?.company && "border-destructive focus:border-destructive"
                      )}
                    />
                    {(errors.experiences as any)?.[index]?.company && (
                      <p className="text-xs text-destructive font-medium">{(errors.experiences as any)[index]?.company?.message as string}</p>
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
                    {(errors.experiences as any)?.[index]?.description && (
                      <p className="text-xs text-destructive font-medium">{(errors.experiences as any)[index]?.description?.message as string}</p>
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
              <h3 className="text-sm font-semibold text-foreground">Portfolio & Links (Optional)</h3>
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
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Link</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("w-56", glass("dropdown"))}>
                {LINK_PLATFORMS.map((platform) => (
                  <DropdownMenuItem
                    key={platform.id}
                    className={cn(
                      "gap-3 cursor-pointer py-2.5",
                      glass("dropdownItem")
                    )}
                    onClick={() => appendLink({ platform: platform.id, url: "" })}
                  >
                    <platform.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{platform.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            {linkFields.length === 0 && (
              <div className={cn(
                "text-center py-8 rounded-lg border border-dashed",
                glass("subtle")
              )}>
                <p className="text-sm text-muted-foreground">
                  No links added yet. Click &quot;Add Link&quot; to begin.
                </p>
              </div>
            )}
            {linkFields.map((field, index) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const platformId = (field as any).platform || "portfolio"
              const platform = LINK_PLATFORMS.find(p => p.id === platformId) || LINK_PLATFORMS[3]
              const Icon = platform.icon
              // Type cast errors because we can't reliably type dynamic index keys in the general case
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentError = (errors.links as any)?.[index]?.url?.message

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
                        {...register(`links.${index}.url`)}
                        className={cn(
                          "h-11 text-sm pl-11",
                          glass("input")
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
                  >
                    <Trash2 className="w-4 h-4" />
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
