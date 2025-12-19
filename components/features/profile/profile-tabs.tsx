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
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-9 sm:h-10">
                <TabsTrigger value="about" className="text-xs sm:text-sm">About</TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm">Experience</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs sm:text-sm">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Card>
                        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">Bio</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {bioText ? (
                                <>
                                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                        {bioExpanded ? bioText : bioPreview}
                                    </p>
                                    {!bioExpanded && (
                                        <Button
                                            variant="link"
                                            className="px-0 mt-2 h-auto text-primary text-sm"
                                            onClick={() => setBioExpanded(true)}
                                        >
                                            Read more
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-4 sm:py-6">
                                    <p className="text-sm text-muted-foreground mb-3">No bio added yet.</p>
                                    <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20 text-left">
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
                        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">Looking For</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(intentIcons).slice(0, 3).map(([label, { icon: Icon, color }]) => (
                                    <Badge
                                        key={label}
                                        variant="outline"
                                        className={`${color} px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium`}
                                    >
                                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                        {label}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </TabsContent>

            <TabsContent value="experience" className="mt-4 sm:mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Card>
                        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">Work Experience</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                            <div className="border-l-2 border-muted pl-4 sm:pl-6 pb-4 sm:pb-6 relative">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                                <h3 className="font-bold text-sm sm:text-base">Senior Developer</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">TechStart Inc. • 2022 - Present</p>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                                    Leading the frontend team, migrating legacy codebase to Next.js, and{" "}
                                    <span className="font-semibold text-primary inline-flex items-center">
                                        <Rocket className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 inline" />
                                        improving performance by 40%
                                    </span>
                                    .
                                </p>
                            </div>
                            <div className="border-l-2 border-muted pl-4 sm:pl-6 relative">
                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted-foreground" />
                                <h3 className="font-bold text-sm sm:text-base">Software Engineer</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Creative Solutions • 2019 - 2022</p>
                                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                                    Developed{" "}
                                    <span className="font-semibold text-primary">full-stack features</span>
                                    {" "}for e-commerce clients using MERN stack.
                                </p>
                            </div>

                            <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-primary">AI Tip:</span> Adding work experience helps us match you with complementary team members based on your expertise.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </TabsContent>

            <TabsContent value="projects" className="mt-4 sm:mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
                            {isOwnProfile ? (
                                <>
                                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                                        <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-base sm:text-lg mb-2">Add your first project</h3>
                                    <p className="text-center text-xs sm:text-sm text-muted-foreground max-w-sm mb-3 px-2">
                                        Showcase your work and attract collaborators by adding projects to your profile.
                                    </p>
                                    <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4 max-w-md">
                                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-semibold text-primary">AI Tip:</span> Adding your thesis or side projects increases match accuracy by 20%. We'll use this to find teammates with complementary skills.
                                        </p>
                                    </div>
                                    <Button className="text-sm h-9">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Project
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
                                        <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-base sm:text-lg mb-2">Projects are private</h3>
                                    <p className="text-center text-xs sm:text-sm text-muted-foreground max-w-sm px-2">
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
