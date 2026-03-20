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
import { SearchableCombobox, ComboboxOption } from "@/components/ui/searchable-combobox"
import { jobTitlesDatabase } from "@/lib/data/job-titles-database"
import { cn } from "@/lib/utils"

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
    <div className="space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Experience & Projects</h2>
        <p className="text-lg text-muted-foreground">Add your experiences and link your portfolios.</p>
      </div>

      <div className="space-y-10">
        {/* Experiences Section */}
        <div>
          <div className="flex items-center justify-between mb-5 border-b border-border/10 pb-3">
            <h3 className="font-semibold text-lg">Experiences (Optional)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendExp({ title: "", company: "", description: "" })}
              className="gap-2 h-10 px-4 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5" /> Add Experience
            </Button>
          </div>

          <div className="space-y-6">
            {expFields.length === 0 && (
              <p className="text-base text-muted-foreground text-center py-6 bg-white/5 rounded-lg border border-white/5 border-dashed">
                No experiences added yet. Click &quot;Add Experience&quot; to begin.
              </p>
            )}
            {expFields.map((field, index) => (
              <GlassCard key={field.id} className="relative transition-all duration-300 border-border/10 p-5 sm:p-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors z-10"
                  onClick={() => removeExp(index)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>

                <div className="space-y-5">
                  <div className="grid gap-2.5">
                    <Label htmlFor={`experiences.${index}.title`} className="text-base font-medium">Job Title / Role</Label>
                    <Controller
                      control={control}
                      name={`experiences.${index}.title` as const}
                      render={({ field: titleField }) => (
                        <SearchableCombobox
                          options={jobTitleOptions}
                          selected={titleField.value ? [titleField.value] : []}
                          onChange={(selected) => titleField.onChange(selected[0] || "")}
                          placeholder="Select or type job title..."
                          searchPlaceholder="Search job titles (e.g., Software Engineer, Plumber, Teacher)..."
                          emptyMessage="No job titles found. Type to add custom."
                          maxHeight={300}
                          allowCustom={true}
                          onAddCustom={(customTitle) => {
                            titleField.onChange(customTitle)
                          }}
                          showCategories={true}
                        />
                      )}
                    />
                  </div>
                  <div className="grid gap-2.5">
                    <Label htmlFor={`experiences.${index}.company`} className="text-base font-medium">Company / Organization</Label>
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
                        "h-12 bg-background border-border focus:border-primary/50 focus:bg-accent/50 transition-all duration-300 text-base",
                        (errors.experiences as any)?.[index]?.company && "border-destructive focus:border-destructive"
                      )}
                    />
                    {(errors.experiences as any)?.[index]?.company && (
                      <p className="text-sm text-destructive">{(errors.experiences as any)[index]?.company?.message as string}</p>
                    )}
                  </div>
                  <div className="grid gap-2.5">
                    <Label htmlFor={`experiences.${index}.description`} className="text-base font-medium">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Textarea
                      id={`experiences.${index}.description`}
                      placeholder="What did you do? (Optional)"
                      className="resize-none min-h-[100px] bg-background border-border focus:border-primary/50 focus:bg-accent/50 transition-all duration-300 text-base"
                      {...register(`experiences.${index}.description`, {
                        maxLength: {
                          value: 2000,
                          message: "Description must be less than 2000 characters"
                        }
                      })}
                    />
                    {(errors.experiences as any)?.[index]?.description && (
                      <p className="text-sm text-destructive">{(errors.experiences as any)[index]?.description?.message as string}</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Portfolios / Links Section */}
        <div>
          <div className="flex items-center justify-between mb-5 border-b border-border/10 pb-3">
            <div>
              <h3 className="font-semibold text-lg">Portfolio & Links (Optional)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your work experience and portfolio links.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-10 px-4 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  Add Link
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-xl border-white/10">
                {LINK_PLATFORMS.map((platform) => (
                  <DropdownMenuItem
                    key={platform.id}
                    className="gap-3 cursor-pointer hover:bg-white/5 transition-colors py-3"
                    onClick={() => appendLink({ platform: platform.id, url: "" })}
                  >
                    <platform.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base">{platform.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-5">
            {linkFields.length === 0 && (
              <p className="text-base text-muted-foreground text-center py-6 bg-white/5 rounded-lg border border-white/5 border-dashed">
                No links added yet. Click &quot;Add Link&quot; to begin.
              </p>
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
                <div key={field.id} className="flex gap-3 items-start relative group">
                  <input type="hidden" {...register(`links.${index}.platform` as const)} defaultValue={platformId} />
                  <div className="flex-1 grid gap-2.5">
                    <div className="relative flex items-center">
                      <div className="absolute left-4 flex items-center justify-center p-2 bg-white/5 rounded-md border border-white/5">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Input
                        id={`links.${index}.url`}
                        placeholder={`https://${platform.id}.com/username`}
                        {...register(`links.${index}.url`)}
                        className="h-12 pl-14 bg-background border-border focus:border-primary/50 focus:bg-accent/50 transition-all duration-300 text-base"
                      />
                    </div>
                    {typeof currentError === "string" && (
                      <p className="text-sm text-destructive">{currentError}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="w-5 h-5" />
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
