/**
 * ProfileTabs — About, Experience, Projects tabs for the profile view
 *
 * ENHANCEMENTS OVER ORIGINAL (Phase 1-3):
 *
 * 1. INTERESTS SECTION (user_interests):
 *    Problem: The user_interests table stored hobbies/topics (e.g. "Machine Learning",
 *    "Open Source", "UI Design") but the profile never displayed them. This is a
 *    valuable matching signal — shared interests drive collaboration quality.
 *    Solution: Added an "Interests" card in the About tab with rose-colored badges.
 *    The grid layout is now lg:grid-cols-3 (was md:grid-cols-2) to accommodate
 *    all three sections (Skills, Interests, Looking For) side by side on desktop.
 *
 * 2. PROJECT IMAGE THUMBNAILS (image_url):
 *    Problem: user_projects has an image_url field for project screenshots/hero
 *    images but it was never rendered. Project cards were text-only, making them
 *    less engaging and harder to scan.
 *    Solution: Hero image at the top of each project card with hover zoom effect
 *    (scale-105, 300ms). Images are lazy-loaded. Cards that lack image_url render
 *    as before (no layout shift due to conditional render).
 *
 * 3. EXPERIENCE DURATION (formatDuration):
 *    Problem: The timeline showed "Jan 2020 - Present" but never calculated the
 *    actual duration ("5 yrs 2 mos"). This is a standard LinkedIn-like signal
 *    that helps viewers quickly assess career depth.
 *    Solution: Added inline duration tag using new formatDuration() utility,
 *    e.g. "Jan 2020 - Present • 5 yrs 2 mos".
 *
 * 4. INLINE BIO EDITING:
 *    Problem: Editing bio required navigating to Settings page. High friction
 *    for the most important profile field (bio completion is 5% of score, drives
 *    AI match quality and viewer engagement).
 *    Solution: Click-to-edit Textarea with Save/Cancel, character counter (1000
 *    max), and loading state. Uses useUpdateProfile mutation for optimistic
 *    updates. Pencil icon appears on hover for own profile. Empty state shows
 *    an "Add bio" button instead of the generic AI tip.
 *
 * 5. WHITESPACE PRESERVATION:
 *    Problem: Bio text lost paragraph breaks because React collapses whitespace.
 *    Multi-paragraph bios displayed as one giant block of text.
 *    Solution: Added whitespace-pre-line to the bio paragraph so line breaks
 *    from the textarea are preserved in the display.
 */
"use client"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { Brain, Sprout, GraduationCap, Briefcase, Rocket, Lock, Plus, Sparkles, TerminalSquare, BriefcaseBusiness, FolderGit2, ExternalLink, Heart, Pencil, Check, X, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import { formatDateRange, formatDuration } from "@/lib/utils/format-date"
import { useUpdateProfile } from "@/hooks/use-profile"
import { toast } from "sonner"

const intentIcons: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
    "Technical Co-founder": { icon: Brain, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30" },
    "Open Source": { icon: Sprout, color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30" },
    "Mentorship": { icon: GraduationCap, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" },
    "Freelance": { icon: Briefcase, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30" },
    "Startup": { icon: Rocket, color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/30" },
}

interface Experience {
    id: string
    title: string
    company?: string | null
    description?: string | null
    startDate?: string | null
    endDate?: string | null
    isCurrent?: boolean
}

interface Project {
    id: string
    title: string
    description?: string | null
    url?: string | null
    imageUrl?: string | null
    techStack?: string[]
    isPublic?: boolean
}

interface ProfileTabsProps {
    isOwnProfile?: boolean
    bio?: string | null
    lookingFor?: string[] | null
    interests?: string[] | null
    skills?: { skillName: string, proficiency?: string | null, isPrimary?: boolean }[]
    experiences?: Experience[]
    projects?: Project[]
}

export function ProfileTabs({
    isOwnProfile = false,
    bio,
    lookingFor,
    interests,
    skills,
    experiences,
    projects,
}: ProfileTabsProps) {
    const [bioExpanded, setBioExpanded] = useState(false)
    const [isEditingBio, setIsEditingBio] = useState(false)
    const [bioDraft, setBioDraft] = useState("")
    const [isSavingBio, setIsSavingBio] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { mutateAsync: updateProfile } = useUpdateProfile()

    // Normalize optional props with safe defaults for rendering
    const safeLookingFor = lookingFor ?? []
    const safeInterests = interests ?? []
    const safeSkills = skills ?? []
    const safeExperiences = experiences ?? []
    const safeProjects = projects ?? []

    // Calculate dynamic preview for bio
    const bioSentences = bio ? bio.split(". ") : []
    const bioPreview = bioSentences.length > 2 && !bioExpanded
        ? bioSentences.slice(0, 2).join(". ") + "..."
        : bio

    const handleBioEdit = () => {
        setBioDraft(bio ?? "")
        setIsEditingBio(true)
        setTimeout(() => textareaRef.current?.focus(), 50)
    }

    const handleBioSave = async () => {
        const trimmed = bioDraft.trim()
        if (trimmed === (bio ?? "")) {
            setIsEditingBio(false)
            return
        }
        setIsSavingBio(true)
        try {
            await updateProfile({ bio: trimmed || undefined })
            setIsEditingBio(false)
            toast.success("Bio updated")
        } catch {
            toast.error("Failed to update bio")
        } finally {
            setIsSavingBio(false)
        }
    }

    const handleBioCancel = () => {
        setBioDraft("")
        setIsEditingBio(false)
    }

    return (
        <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-10 sm:h-11 bg-muted/40 p-1 border border-border/50">
                <TabsTrigger value="about" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">About</TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Experience</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="grid gap-6"
                >
                    <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm" innerClassName="p-5 sm:p-6 lg:p-7">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <TerminalSquare className="h-5 w-5 text-primary" />
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Bio</h3>
                            </div>
                            {isOwnProfile && !isEditingBio && (
                                <button
                                    type="button"
                                    onClick={handleBioEdit}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                    title="Edit bio"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {isEditingBio ? (
                            <div className="space-y-3">
                                <Textarea
                                    ref={textareaRef}
                                    value={bioDraft}
                                    onChange={(e) => setBioDraft(e.target.value)}
                                    placeholder="Tell others about yourself, your skills, and what you're working on..."
                                    className="min-h-[120px] resize-y text-sm"
                                    maxLength={1000}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{bioDraft.length}/1000</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleBioCancel}
                                            disabled={isSavingBio}
                                        >
                                            <X className="h-3.5 w-3.5 mr-1.5" />
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleBioSave}
                                            disabled={isSavingBio}
                                        >
                                            {isSavingBio ? (
                                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            ) : (
                                                <Check className="h-3.5 w-3.5 mr-1.5" />
                                            )}
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : bio ? (
                            <div className="space-y-3">
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {bioPreview}
                                </p>
                                {bioSentences.length > 2 && (
                                    <Button
                                        variant="link"
                                        className="px-0 h-auto text-primary text-sm font-semibold hover:no-underline hover:text-primary/80"
                                        onClick={() => setBioExpanded(!bioExpanded)}
                                    >
                                        {bioExpanded ? "Show less" : "Read full bio"}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground mb-4">No bio added yet.</p>
                                {isOwnProfile ? (
                                    <Button variant="outline" size="sm" onClick={handleBioEdit}>
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                        Add bio
                                    </Button>
                                ) : (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-left max-w-lg mx-auto">
                                        <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            <span className="font-semibold text-foreground">AI Tip:</span> A detailed bio increases profile views by 3x and helps us match you with the right collaborators.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Skills Block */}
                        <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm h-fit" innerClassName="p-5 sm:p-6 lg:p-7">
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="h-5 w-5 text-primary" />
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Technical Arsenal</h3>
                            </div>

                            {safeSkills.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Primary Skills */}
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Expertise</p>
                                        <div className="flex flex-wrap gap-2">
                                            {safeSkills.filter(s => s.isPrimary).map((skill) => (
                                                <Badge key={skill.skillName} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2.5 py-1 text-sm font-semibold">
                                                    {skill.skillName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Secondary Skills */}
                                    {safeSkills.filter(s => !s.isPrimary).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Other Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {safeSkills.filter(s => !s.isPrimary).map((skill) => (
                                                    <Badge key={skill.skillName} variant="secondary" className="px-2.5 py-1 text-xs border border-border/50 font-medium bg-muted/50">
                                                        {skill.skillName}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No skills added yet.</p>
                            )}
                        </GlassCard>

                        {/* Interests Block — NEW */}
                        <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm h-fit" innerClassName="p-5 sm:p-6 lg:p-7">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="h-5 w-5 text-rose-500" />
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Interests</h3>
                            </div>

                            {safeInterests.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {safeInterests.map((interest) => (
                                        <Badge
                                            key={interest}
                                            variant="outline"
                                            className="px-2.5 py-1 text-xs sm:text-sm font-medium border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 shadow-sm"
                                        >
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No interests added yet.</p>
                            )}
                        </GlassCard>

                        {/* Intents Block */}
                        <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm h-fit" innerClassName="p-5 sm:p-6 lg:p-7">
                            <div className="flex items-center gap-2 mb-4">
                                <Rocket className="h-5 w-5 text-primary" />
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Looking For</h3>
                            </div>

                            {safeLookingFor.length > 0 ? (
                                <div className="flex flex-wrap gap-2.5">
                                    {safeLookingFor.map((intentLabel) => {
                                        // Lookup predefined formatting or fallback
                                        const mapping = intentIcons[intentLabel as keyof typeof intentIcons] || {
                                            icon: Brain,
                                            color: "text-foreground bg-muted border-border/50"
                                        }
                                        const Icon = mapping.icon
                                        return (
                                            <Badge
                                                key={intentLabel}
                                                variant="outline"
                                                className={`${mapping.color} px-3 py-1.5 text-xs sm:text-sm font-medium border shadow-sm backdrop-blur-sm`}
                                            >
                                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                                {intentLabel}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No collaboration goals specified.</p>
                            )}
                        </GlassCard>
                    </div>
                </motion.div>
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm" innerClassName="p-5 sm:p-6 lg:p-7">
                        <div className="flex items-center gap-2 mb-6">
                            <BriefcaseBusiness className="h-5 w-5 text-primary" />
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Work Experience</h3>
                        </div>

                        <div className="space-y-6 md:space-y-8 pl-2">
                            {safeExperiences.length > 0 ? (
                                safeExperiences.map((exp, index) => (
                                    <div key={exp.id} className="relative border-l-2 border-muted/70 pl-6 sm:pl-8 pb-2">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background shadow-sm ${exp.isCurrent ? 'bg-primary' : 'bg-muted-foreground/60'}`} />

                                        <h4 className="font-bold text-base sm:text-lg text-foreground tracking-tight">{exp.title}</h4>
                                        <p className="text-sm text-emerald-500/90 dark:text-emerald-400 font-medium mt-0.5">
                                            {exp.company} <span className="text-muted-foreground px-1">•</span> <span className="text-muted-foreground">{formatDateRange(exp.startDate, exp.isCurrent ? null : exp.endDate)}</span>
                                            {exp.startDate && (
                                                <>
                                                    <span className="text-muted-foreground px-1">•</span>
                                                    <span className="text-xs text-muted-foreground/70">{formatDuration(exp.startDate, exp.isCurrent ? null : exp.endDate)}</span>
                                                </>
                                            )}
                                        </p>
                                        {exp.description && (
                                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                                {exp.description}
                                            </p>
                                        )}

                                        {/* Subtle dividing line if not last */}
                                        {index !== safeExperiences.length - 1 && (
                                            <div className="absolute -bottom-4 sm:-bottom-5 left-6 right-0 h-px bg-border/40" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground mb-4">No experience entries found.</p>
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-left max-w-lg mx-auto">
                                        <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            <span className="font-semibold text-foreground">AI Tip:</span> Adding work experience helps us match you with complementary team members based on your specific industry context.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm" innerClassName="p-5 sm:p-6 lg:p-7">
                        <div className="flex items-center gap-2 mb-6">
                            <FolderGit2 className="h-5 w-5 text-primary" />
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Projects</h3>
                        </div>

                        {safeProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {safeProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="rounded-xl bg-card/60 border border-border/40 hover:border-primary/30 transition-all group overflow-hidden"
                                    >
                                        {/* Project Image */}
                                        {project.imageUrl && (
                                            <div className="relative h-36 sm:h-40 w-full bg-muted/30 overflow-hidden">
                                                <img
                                                    src={project.imageUrl}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                                                {project.title}
                                            </h4>
                                            {project.url && (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                                                {project.description}
                                            </p>
                                        )}
                                        {project.techStack && project.techStack.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {project.techStack.map((tech) => (
                                                    <Badge key={tech} variant="secondary" className="px-2 py-0.5 text-[10px] border border-border/40">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : isOwnProfile ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center mb-5 border border-primary/20 shadow-inner">
                                    <FolderGit2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl mb-2 tracking-tight">Add your first project</h3>
                                <p className="text-center text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                                    Showcase your work and attract collaborators by detailing projects on your profile.
                                </p>

                                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-primary/10 border border-primary/20 mb-6 max-w-md">
                                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                        <span className="font-semibold text-foreground">AI Tip:</span> Adding your thesis or side projects increases match accuracy by <span className="text-primary font-bold">20%</span>. We use project specifics to find teammates with complementary skills.
                                    </p>
                                </div>
                                <Button size="default" className="shadow-md">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Project
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 px-6">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center mb-5 border border-border/50">
                                    <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/70" />
                                </div>
                                <h3 className="font-bold text-lg sm:text-xl mb-2 tracking-tight">No projects yet</h3>
                                <p className="text-center text-sm text-muted-foreground max-w-sm leading-relaxed">
                                    This user hasn&apos;t added any projects yet.
                                </p>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </TabsContent>
        </Tabs>
    )
}
