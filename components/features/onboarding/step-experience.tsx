"use client"

import React from "react"
import { useFormContext, useFieldArray } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Github, Linkedin, Instagram, Link as LinkIcon, Briefcase } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LINK_PLATFORMS = [
    { id: "github", label: "GitHub", icon: Github },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "portfolio", label: "Portfolio / Website", icon: LinkIcon }
]

export function StepExperience() {
    const { register, control, formState: { errors } } = useFormContext()

    const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
        control,
        name: "experiences"
    })

    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
        control,
        name: "links"
    })

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Experience & Projects</h2>
                <p className="text-muted-foreground">Add your experiences and link your portfolios.</p>
            </div>

            <div className="space-y-10">
                {/* Experiences Section */}
                <div>
                    <div className="flex items-center justify-between mb-4 border-b border-border/10 pb-2">
                        <h3 className="font-semibold text-base">Experiences (Optional)</h3>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => appendExp({ title: "", company: "", description: "" })}
                            className="gap-2 h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Experience
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {expFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">
                                No experiences added yet. Click &quot;Add Experience&quot; to begin.
                            </p>
                        )}
                        {expFields.map((field, index) => (
                            <GlassCard key={field.id} className="relative transition-all duration-300 border-border/10 p-4 sm:p-5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={() => removeExp(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="space-y-4 pr-8">
                                    <div className="grid gap-2">
                                        <Label htmlFor={`experiences.${index}.title`}>Job Title / Role</Label>
                                        <Input
                                            id={`experiences.${index}.title`}
                                            placeholder="e.g. Senior Developer"
                                            {...register(`experiences.${index}.title`)}
                                            className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={`experiences.${index}.company`}>Company / Organization</Label>
                                        <Input
                                            id={`experiences.${index}.company`}
                                            placeholder="e.g. TechStart Inc."
                                            {...register(`experiences.${index}.company`)}
                                            className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={`experiences.${index}.description`}>Description</Label>
                                        <Textarea
                                            id={`experiences.${index}.description`}
                                            placeholder="What did you do?"
                                            className="resize-none min-h-[80px] bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
                                            {...register(`experiences.${index}.description`)}
                                        />
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Portfolios / Links Section */}
                <div>
                    <div className="flex items-center justify-between mb-4 border-b border-border/10 pb-2">
                        <h3 className="font-semibold text-base">Portfolio & Links (Optional)</h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 h-8 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none" />
                                    <Plus className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">Add Link</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-background/80 backdrop-blur-xl border-white/10">
                                {LINK_PLATFORMS.map((platform) => (
                                    <DropdownMenuItem
                                        key={platform.id}
                                        className="gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => appendLink({ platform: platform.id, url: "" })}
                                    >
                                        <platform.icon className="w-4 h-4 text-muted-foreground" />
                                        <span>{platform.label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="space-y-4">
                        {linkFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">
                                No links added yet. Click &quot;Add Link&quot; to begin.
                            </p>
                        )}
                        {linkFields.map((field, index) => {
                            const platformId = (field as any).platform || "portfolio"
                            const platform = LINK_PLATFORMS.find(p => p.id === platformId) || LINK_PLATFORMS[3]
                            const Icon = platform.icon
                            // Type cast errors because we can't reliably type dynamic index keys in the general case
                            const currentError = (errors.links as any)?.[index]?.url?.message

                            return (
                                <div key={field.id} className="flex gap-2 items-start relative group">
                                    <input type="hidden" {...register(`links.${index}.platform` as const)} defaultValue={platformId} />
                                    <div className="flex-1 grid gap-2">
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3 flex items-center justify-center p-1 bg-white/5 rounded-md border border-white/5">
                                                <Icon className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <Input
                                                id={`links.${index}.url`}
                                                placeholder={`https://${platform.id}.com/username`}
                                                {...register(`links.${index}.url`)}
                                                className="pl-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300"
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
