"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Brain, Sprout, GraduationCap, Briefcase, Rocket, Lock, Plus, Sparkles, TerminalSquare, BriefcaseBusiness, FolderGit2 } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"

const intentIcons = {
    "Technical Co-founder": { icon: Brain, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30" },
    "Open Source": { icon: Sprout, color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30" },
    "Mentorship": { icon: GraduationCap, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" },
    "Freelance": { icon: Briefcase, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30" },
    "Startup": { icon: Rocket, color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/30" },
}

interface Experience {
    id: string
    title: string
    company: string
    description: string
    startDate: string
    endDate?: string | null
    isCurrent?: boolean
}

// Represents mapped properties from expected-objects schemas (01, 02, 04, 05)
interface ProfileTabsProps {
    isOwnProfile?: boolean
    bio?: string
    lookingFor?: string[]
    skills?: { skillName: string, proficiency: string, isPrimary: boolean }[] // from 02-user-skills
    experiences?: Experience[] // from 04-user-experiences
    projects?: unknown[] // from 05-user-projects
}

export function ProfileTabs({
    isOwnProfile = false,
    bio = "I'm a passionate Full Stack Developer with 5 years of experience building scalable web applications. My expertise lies in the React ecosystem (Next.js), Node.js, and cloud architecture. Currently, I'm exploring the intersection of Web3 and AI, looking for opportunities to collaborate on innovative projects. I love solving complex problems and mentoring junior developers.",
    lookingFor = ["Technical Co-founder", "Open Source", "Startup"],
    skills = [
        { skillName: "React", proficiency: "expert", isPrimary: true },
        { skillName: "TypeScript", proficiency: "advanced", isPrimary: true },
        { skillName: "Node.js", proficiency: "advanced", isPrimary: true },
        { skillName: "System Architecture", proficiency: "advanced", isPrimary: false },
        { skillName: "AWS", proficiency: "intermediate", isPrimary: false },
        { skillName: "Next.js", proficiency: "expert", isPrimary: false }
    ],
    experiences = [
        {
            id: "1",
            title: "Senior Developer",
            company: "TechStart Inc.",
            startDate: "2022",
            isCurrent: true,
            description: "Leading the frontend team, migrating legacy codebase to Next.js, and improving performance by 40%.",
        },
        {
            id: "2",
            title: "Software Engineer",
            company: "Creative Solutions",
            startDate: "2019",
            endDate: "2022",
            isCurrent: false,
            description: "Developed full-stack features for e-commerce clients using MERN stack.",
        }
    ]
}: ProfileTabsProps) {
    const [bioExpanded, setBioExpanded] = useState(false)

    // Calculate dynamic preview for bio
    const bioSentences = bio ? bio.split(". ") : []
    const bioPreview = bioSentences.length > 2 && !bioExpanded
        ? bioSentences.slice(0, 2).join(". ") + "..."
        : bio

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
                        <div className="flex items-center gap-2 mb-4">
                            <TerminalSquare className="h-5 w-5 text-primary" />
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Bio</h3>
                        </div>
                        {bio ? (
                            <div className="space-y-3">
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-left max-w-lg mx-auto">
                                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                        <span className="font-semibold text-foreground">AI Tip:</span> A detailed bio increases profile views by 3x and helps us match you with the right collaborators.
                                    </p>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Skills Block */}
                        <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm" innerClassName="p-5 sm:p-6 lg:p-7">
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="h-5 w-5 text-primary" />
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Technical Arsenal</h3>
                            </div>

                            {skills.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Primary Skills */}
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Expertise</p>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.filter(s => s.isPrimary).map((skill) => (
                                                <Badge key={skill.skillName} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2.5 py-1 text-sm font-semibold">
                                                    {skill.skillName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Secondary Skills */}
                                    {skills.filter(s => !s.isPrimary).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Other Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.filter(s => !s.isPrimary).map((skill) => (
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

                        {/* Intents Block */}
                        <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm" innerClassName="p-5 sm:p-6 lg:p-7">
                            <div className="flex items-center gap-2 mb-4">
                                <Rocket className="h-5 w-5 text-primary" />
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Looking For</h3>
                            </div>

                            {lookingFor.length > 0 ? (
                                <div className="flex flex-wrap gap-2.5">
                                    {lookingFor.map((intentLabel) => {
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
                            {experiences.length > 0 ? (
                                experiences.map((exp, index) => (
                                    <div key={exp.id} className="relative border-l-2 border-muted/70 pl-6 sm:pl-8 pb-2">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background shadow-sm ${exp.isCurrent ? 'bg-primary' : 'bg-muted-foreground/60'}`} />

                                        <h4 className="font-bold text-base sm:text-lg text-foreground tracking-tight">{exp.title}</h4>
                                        <p className="text-sm text-emerald-500/90 dark:text-emerald-400 font-medium mt-0.5">
                                            {exp.company} <span className="text-muted-foreground px-1">•</span> <span className="text-muted-foreground">{exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}</span>
                                        </p>
                                        {exp.description && (
                                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                                {exp.description}
                                            </p>
                                        )}

                                        {/* Subtle dividing line if not last */}
                                        {index !== experiences.length - 1 && (
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
                    <GlassCard className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-sm" innerClassName="p-0">
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            {isOwnProfile ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center mb-5 border border-border/50">
                                        <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/70" />
                                    </div>
                                    <h3 className="font-bold text-lg sm:text-xl mb-2 tracking-tight">Projects are private</h3>
                                    <p className="text-center text-sm text-muted-foreground max-w-sm leading-relaxed">
                                        This user prefers to explicitly share their portfolio stack after connecting.
                                    </p>
                                </>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </TabsContent>
        </Tabs>
    )
}

