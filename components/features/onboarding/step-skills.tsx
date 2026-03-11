"use client"

import React, { useState } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

export function StepSkills() {
    const { control, formState: { errors } } = useFormContext()
    const [skillInput, setSkillInput] = useState("")

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-bold tracking-tight">Your Skills</h2>
                <p className="text-lg text-muted-foreground">Add your top skills to help us match you with the right opportunities.</p>
            </div>

            <Controller
                control={control}
                name="skills"
                render={({ field }) => {
                    const skills = field.value || []

                    const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
                        if (e && 'key' in e && e.key !== "Enter") return
                        e?.preventDefault()

                        const trimmedSkill = skillInput.trim()
                        if (trimmedSkill && !skills.includes(trimmedSkill)) {
                            field.onChange([...skills, trimmedSkill])
                            setSkillInput("")
                        }
                    }

                    const handleRemoveSkill = (skillToRemove: string) => {
                        field.onChange(skills.filter((s: string) => s !== skillToRemove))
                    }

                    return (
                        <div className="space-y-5">
                            <div className="grid gap-2.5">
                                <Label htmlFor="skillsInput" className="text-base font-medium">Add Skills</Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="skillsInput"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleAddSkill}
                                        placeholder="e.g. React, UI Design, Marketing (Press Enter)"
                                        className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 text-base"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="flex items-center justify-center px-4 rounded-md bg-white/10 text-white hover:bg-white/20 transition-all duration-300 border border-white/10"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {typeof errors.skills?.message === "string" && (
                                    <p className="text-sm text-destructive">{errors.skills.message}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 min-h-[80px] p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                                {skills.length === 0 ? (
                                    <span className="text-base text-muted-foreground w-full text-center py-4">No skills added yet.</span>
                                ) : (
                                    skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="px-4 py-2 text-base gap-2 pl-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-none">
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="p-1 rounded-full hover:bg-primary/20 transition-colors ml-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                }}
            />
        </div>
    )
}
