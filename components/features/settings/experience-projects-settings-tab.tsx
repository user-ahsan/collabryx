"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash2, Link as LinkIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { validateExperienceProjectsSettings } from "@/lib/validations/settings"
import { toast } from "sonner"

export function ExperienceProjectsSettingsTab({ userId }: { userId: string }) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    interface Experience {
    id: string;
    title: string;
    company?: string;
    description?: string;
    start_date?: string;
    is_current?: boolean;
}

interface Project {
    id: string;
    title: string;
    url?: string;
    description?: string;
    is_public?: boolean;
}

const [experiences, setExperiences] = useState<Experience[]>([])
    const [projects, setProjects] = useState<Project[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (process.env.NODE_ENV === 'development') {
                    setExperiences([
                        { id: '1', title: 'Senior Software Engineer', company: 'TechStart', description: 'Built an AI-powered platform using Next.js and Supabase.', start_date: '2022-01-01', is_current: true }
                    ])
                    setProjects([
                        { id: '1', title: 'Collabryx Platform', url: 'https://collabryx.com', description: 'A platform to find co-founders utilizing AI matching.', is_public: true }
                    ])
                    setIsLoading(false)
                    return
                }

                const [expRes, projRes] = await Promise.all([
                    supabase.from('user_experiences').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                    supabase.from('user_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false })
                ])

                if (expRes.error) throw expRes.error
                if (projRes.error) throw projRes.error

                setExperiences(expRes.data || [])
                setProjects(projRes.data || [])
            } catch (err: unknown) {
                console.error("Error fetching data:", err)
                setError("Failed to load experiences and projects.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [userId, supabase])

    const handleAddExperience = () => {
        setExperiences(prev => [
            {
                id: `new-${Date.now()}`,
                title: "",
                company: "",
                description: "",
                start_date: new Date().toISOString(),
                is_current: true
            },
            ...prev
        ])
    }

    const handleAddProject = () => {
        setProjects(prev => [
            {
                id: `new-${Date.now()}`,
                title: "",
                description: "",
                url: "",
                is_public: true
            },
            ...prev
        ])
    }

    const updateExperience = (id: string, field: string, value: unknown) => {
        setExperiences(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    const updateProject = (id: string, field: string, value: unknown) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        setSuccessMsg(null)

        // Validate before saving
        const validation = validateExperienceProjectsSettings({
            experiences: experiences.map(e => ({
                id: e.id,
                title: e.title,
                company: e.company,
                description: e.description,
                start_date: e.start_date,
                is_current: e.is_current,
            })),
            projects: projects.map(p => ({
                id: p.id,
                title: p.title,
                url: p.url,
                description: p.description,
                is_public: p.is_public,
            })),
        })

        if (!validation.success) {
            setError(validation.errors[0])
            toast.error(validation.errors[0])
            setIsSaving(false)
            return
        }

        try {
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                setSuccessMsg("Experience & Projects saved successfully (Dev mode).")
                setTimeout(() => setSuccessMsg(null), 3000)
                return
            }

            // For Experiences: Delete all then insert
            const expsToInsert = experiences
                .filter(e => e.title || e.company)
                .map(({ id, ...rest }) => ({ user_id: userId, ...rest }))

            const { error: delExpErr } = await supabase.from('user_experiences').delete().eq('user_id', userId)
            if (delExpErr) throw delExpErr
            if (expsToInsert.length > 0) {
                const { error: insExpErr } = await supabase.from('user_experiences').insert(expsToInsert)
                if (insExpErr) throw insExpErr
            }

            // For Projects: Delete all then insert
            const projsToInsert = projects
                .filter(p => p.title)
                .map(({ id, ...rest }) => ({ user_id: userId, ...rest }))

            const { error: delProjErr } = await supabase.from('user_projects').delete().eq('user_id', userId)
            if (delProjErr) throw delProjErr
            if (projsToInsert.length > 0) {
                const { error: insProjErr } = await supabase.from('user_projects').insert(projsToInsert)
                if (insProjErr) throw insProjErr
            }

            setSuccessMsg("Experience & Projects saved successfully.")
            toast.success("Experience & projects updated")
            setTimeout(() => setSuccessMsg(null), 3000)

            // Refetch to get actual IDs
            const [expRes, projRes] = await Promise.all([
                supabase.from('user_experiences').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('user_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false })
            ])
            setExperiences(expRes.data || [])
            setProjects(projRes.data || [])

        } catch (err: unknown) {
            console.error(err)
            const errorMessage = err instanceof Error ? err.message : "Failed to save data."
            setError(errorMessage)
            toast.error(errorMessage)
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
                <CardTitle>Experience & Projects</CardTitle>
                <CardDescription>Showcase your professional timeline and technical projects to matches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-0 pb-0">
                {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
                {successMsg && <div className="text-sm font-medium text-emerald-500 bg-emerald-500/10 p-3 rounded-md">{successMsg}</div>}

                {/* Experiences Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <Label className="text-base font-semibold">Work Experience</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAddExperience} className="hover:bg-primary/20 hover:text-primary">
                            <Plus className="w-4 h-4 mr-2" /> Add Experience
                        </Button>
                    </div>

                    {experiences.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No experiences added yet.</p>}

                    {experiences.map((exp, i) => (
                        <div key={exp.id || i} className="p-4 rounded-xl border border-white/10 bg-white/5 relative group">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setExperiences(prev => prev.filter(e => e.id !== exp.id))}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid gap-4 pr-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <Input
                                            value={exp.title}
                                            onChange={e => updateExperience(exp.id, 'title', e.target.value)}
                                            className="bg-white/5 border-white/10 focus:border-primary/50"
                                            placeholder="e.g. Frontend Developer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input
                                            value={exp.company}
                                            onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                                            className="bg-white/5 border-white/10 focus:border-primary/50"
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={exp.description || ''}
                                        onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                                        className="h-20 bg-white/5 border-white/10 focus:border-primary/50"
                                        placeholder="What did you do?"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Projects Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <Label className="text-base font-semibold">Projects</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAddProject} className="hover:bg-primary/20 hover:text-primary">
                            <Plus className="w-4 h-4 mr-2" /> Add Project
                        </Button>
                    </div>

                    {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No projects added yet.</p>}

                    {projects.map((proj, i) => (
                        <div key={proj.id || i} className="p-4 rounded-xl border border-white/10 bg-white/5 relative group">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setProjects(prev => prev.filter(p => p.id !== proj.id))}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid gap-4 pr-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Project Title</Label>
                                        <Input
                                            value={proj.title}
                                            onChange={e => updateProject(proj.id, 'title', e.target.value)}
                                            className="bg-white/5 border-white/10 focus:border-primary/50"
                                            placeholder="e.g. HealthTracker App"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Project URL</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={proj.url || ''}
                                                onChange={e => updateProject(proj.id, 'url', e.target.value)}
                                                className="pl-9 bg-white/5 border-white/10 focus:border-primary/50"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={proj.description || ''}
                                        onChange={e => updateProject(proj.id, 'description', e.target.value)}
                                        className="h-20 bg-white/5 border-white/10 focus:border-primary/50"
                                        placeholder="What is this project about?"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={proj.is_public}
                                        onChange={(e) => updateProject(proj.id, 'is_public', e.target.checked)}
                                    />
                                    <Label>Publicly Visible to Matches</Label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="mt-4">
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    )
}
