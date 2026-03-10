"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, X } from "lucide-react"

export function SkillsInterestsSettingsTab({ userId }: { userId: string }) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const [skillsInput, setSkillsInput] = useState("")
    const [skills, setSkills] = useState<{ id?: string, skill_name: string }[]>([])

    const [interestsInput, setInterestsInput] = useState("")
    const [interests, setInterests] = useState<{ id?: string, interest: string }[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (process.env.NODE_ENV === 'development') {
                    setSkills([{ skill_name: "React" }, { skill_name: "TypeScript" }, { skill_name: "UI Design" }])
                    setInterests([{ interest: "Web3" }, { interest: "AI Tooling" }])
                    setIsLoading(false)
                    return
                }

                const [skillsRes, interestsRes] = await Promise.all([
                    supabase.from('user_skills').select('id, skill_name').eq('user_id', userId),
                    supabase.from('user_interests').select('id, interest').eq('user_id', userId)
                ])

                if (skillsRes.error) throw skillsRes.error
                if (interestsRes.error) throw interestsRes.error

                setSkills(skillsRes.data || [])
                setInterests(interestsRes.data || [])
            } catch (err) {
                console.error("Error fetching skills/interests:", err)
                setError("Failed to load data.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [userId, supabase])

    const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
        if (e && 'key' in e && e.key !== "Enter") return
        e?.preventDefault()

        const trimmed = skillsInput.trim()
        if (trimmed && !skills.find(s => s.skill_name.toLowerCase() === trimmed.toLowerCase())) {
            setSkills(prev => [...prev, { skill_name: trimmed }])
            setSkillsInput("")
        }
    }

    const handleRemoveSkill = (skillName: string) => {
        setSkills(prev => prev.filter(s => s.skill_name !== skillName))
    }

    const handleAddInterest = (e?: React.KeyboardEvent | React.MouseEvent) => {
        if (e && 'key' in e && e.key !== "Enter") return
        e?.preventDefault()

        const trimmed = interestsInput.trim()
        if (trimmed && !interests.find(i => i.interest.toLowerCase() === trimmed.toLowerCase())) {
            setInterests(prev => [...prev, { interest: trimmed }])
            setInterestsInput("")
        }
    }

    const handleRemoveInterest = (interestName: string) => {
        setInterests(prev => prev.filter(i => i.interest !== interestName))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        setSuccessMsg(null)

        try {
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                setSuccessMsg("Skills & Interests saved successfully (Dev mode).")
                setTimeout(() => setSuccessMsg(null), 3000)
                return
            }

            // Reconcile Skills: Delete all existing and insert new
            const { error: delSkillsErr } = await supabase.from('user_skills').delete().eq('user_id', userId)
            if (delSkillsErr) throw delSkillsErr
            if (skills.length > 0) {
                const { error: insSkillsErr } = await supabase.from('user_skills').insert(
                    skills.map(s => ({ user_id: userId, skill_name: s.skill_name }))
                )
                if (insSkillsErr) throw insSkillsErr
            }

            // Reconcile Interests
            const { error: delIntErr } = await supabase.from('user_interests').delete().eq('user_id', userId)
            if (delIntErr) throw delIntErr
            if (interests.length > 0) {
                const { error: insIntErr } = await supabase.from('user_interests').insert(
                    interests.map(i => ({ user_id: userId, interest: i.interest }))
                )
                if (insIntErr) throw insIntErr
            }

            setSuccessMsg("Skills & Interests saved successfully.")
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (err: unknown) {
            console.error(err)
            const errorMessage = err instanceof Error ? err.message : "Failed to save data."
            setError(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle>Skills & Interests</CardTitle>
                <CardDescription>Manage your top skills and professional interests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
                {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
                {successMsg && <div className="text-sm font-medium text-emerald-500 bg-emerald-500/10 p-3 rounded-md">{successMsg}</div>}

                {/* Skills Section */}
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="skillsInput" className="text-base font-semibold">Provide your Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                id="skillsInput"
                                value={skillsInput}
                                onChange={(e) => setSkillsInput(e.target.value)}
                                onKeyDown={handleAddSkill}
                                placeholder="e.g. React, UI Design, Marketing (Press Enter)"
                                className="bg-white/5 border-white/10 focus:border-primary/50"
                            />
                            <button
                                type="button"
                                onClick={handleAddSkill}
                                className="flex items-center justify-center p-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-all duration-300 border border-white/10"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[60px] p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        {skills.length === 0 ? (
                            <span className="text-sm text-muted-foreground w-full text-center py-2">No skills added yet.</span>
                        ) : (
                            skills.map((skill) => (
                                <Badge key={skill.skill_name} variant="secondary" className="px-3 py-1.5 text-sm gap-1 pl-4 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-none">
                                    {skill.skill_name}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(skill.skill_name)}
                                        className="p-0.5 rounded-full hover:bg-primary/20 transition-colors ml-1"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))
                        )}
                    </div>
                </div>

                {/* Interests Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="grid gap-2">
                        <Label htmlFor="interestsInput" className="text-base font-semibold">Your Interests & Goals</Label>
                        <div className="flex gap-2">
                            <Input
                                id="interestsInput"
                                value={interestsInput}
                                onChange={(e) => setInterestsInput(e.target.value)}
                                onKeyDown={handleAddInterest}
                                placeholder="e.g. Fintech, EdTech, Web3 (Press Enter)"
                                className="bg-white/5 border-white/10 focus:border-primary/50"
                            />
                            <button
                                type="button"
                                onClick={handleAddInterest}
                                className="flex items-center justify-center p-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-all duration-300 border border-white/10"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[60px] p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        {interests.length === 0 ? (
                            <span className="text-sm text-muted-foreground w-full text-center py-2">No interests added yet.</span>
                        ) : (
                            interests.map((interest) => (
                                <Badge key={interest.interest} variant="secondary" className="px-3 py-1.5 text-sm gap-1 pl-4 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-none">
                                    {interest.interest}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveInterest(interest.interest)}
                                        className="p-0.5 rounded-full hover:bg-blue-500/20 transition-colors ml-1"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))
                        )}
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="mt-4">
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    )
}
