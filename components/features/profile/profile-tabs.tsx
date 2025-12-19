"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Brain, Sprout, GraduationCap, Briefcase, Rocket, Lock, Plus, Sparkles } from "lucide-react"

const intentIcons = {
    "Technical Co-founder": { icon: Brain, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30" },
    "Open Source": { icon: Sprout, color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30" },
    "Mentorship": { icon: GraduationCap, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" },
    "Freelance": { icon: Briefcase, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30" },
    "Startup": { icon: Rocket, color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/30" },
}

interface ProfileTabsProps {
    isOwnProfile?: boolean
}

export function ProfileTabs({ isOwnProfile = false }: ProfileTabsProps) {
    const [bioExpanded, setBioExpanded] = useState(false)

    const bioText = "I'm a passionate Full Stack Developer with 5 years of experience building scalable web applications. My expertise lies in the React ecosystem (Next.js), Node.js, and cloud architecture. Currently, I'm exploring the intersection of Web3 and AI, looking for opportunities to collaborate on innovative projects. I love solving complex problems and mentoring junior developers."
    const bioPreview = bioText.split(". ").slice(0, 3).join(". ") + "."

    return (
        <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Bio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {bioText ? (
                                <>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {bioExpanded ? bioText : bioPreview}
                                    </p>
                                    {!bioExpanded && (
                                        <Button
                                            variant="link"
                                            className="px-0 mt-2 h-auto text-primary"
                                            onClick={() => setBioExpanded(true)}
                                        >
                                            Read more
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-3">No bio added yet.</p>
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-left">
                                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-semibold text-primary">AI Tip:</span> A detailed bio increases profile views by 3x and helps us match you with the right collaborators.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Looking For</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(intentIcons).slice(0, 3).map(([label, { icon: Icon, color }]) => (
                                    <Badge
                                        key={label}
                                        variant="outline"
                                        className={`${color} px-3 py-2 text-sm font-medium`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {label}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Work Experience</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="border-l-2 border-muted pl-6 pb-6 relative">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                                <h3 className="font-bold">Senior Developer</h3>
                                <p className="text-sm text-muted-foreground">TechStart Inc. • 2022 - Present</p>
                                <p className="mt-2 text-muted-foreground">
                                    Leading the frontend team, migrating legacy codebase to Next.js, and{" "}
                                    <span className="font-semibold text-primary inline-flex items-center">
                                        <Rocket className="h-3.5 w-3.5 mr-1 inline" />
                                        improving performance by 40%
                                    </span>
                                    .
                                </p>
                            </div>
                            <div className="border-l-2 border-muted pl-6 relative">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted-foreground" />
                                <h3 className="font-bold">Software Engineer</h3>
                                <p className="text-sm text-muted-foreground">Creative Solutions • 2019 - 2022</p>
                                <p className="mt-2 text-muted-foreground">
                                    Developed{" "}
                                    <span className="font-semibold text-primary">full-stack features</span>
                                    {" "}for e-commerce clients using MERN stack.
                                </p>
                            </div>

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-primary">AI Tip:</span> Adding work experience helps us match you with complementary team members based on your expertise.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                            {isOwnProfile ? (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <Plus className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">Add your first project</h3>
                                    <p className="text-center text-muted-foreground max-w-sm mb-3">
                                        Showcase your work and attract collaborators by adding projects to your profile.
                                    </p>
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4 max-w-md">
                                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-semibold text-primary">AI Tip:</span> Adding your thesis or side projects increases match accuracy by 20%. We'll use this to find teammates with complementary skills.
                                        </p>
                                    </div>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Project
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Lock className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">Projects are private</h3>
                                    <p className="text-center text-muted-foreground max-w-sm">
                                        This user prefers to share projects after connecting.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </TabsContent>
        </Tabs>
    )
}
