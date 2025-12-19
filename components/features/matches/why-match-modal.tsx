"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Brain, Users, Calendar, TrendingUp } from "lucide-react"

interface WhyMatchModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    match: {
        name: string
        compatibility: number
        skills: string[]
        role: string
    }
}

export function WhyMatchModal({ open, onOpenChange, match }: WhyMatchModalProps) {
    // Calculate match breakdown (in real app, this comes from backend)
    const skillsOverlap = 85
    const complementaryScore = 92
    const sharedInterests = 78
    const aiConfidence = (match.compatibility / 100).toFixed(2)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Why {match.name}?
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        Here's how our AI calculated this <span className="font-bold text-primary">{match.compatibility}% match</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Skills Overlap */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Skills Overlap</h3>
                                    <p className="text-xs text-muted-foreground">Shared technical expertise</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{skillsOverlap}%</span>
                        </div>
                        <Progress value={skillsOverlap} className="h-2" />
                        <div className="flex flex-wrap gap-1.5">
                            {match.skills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Complementary Skills */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Complementary Fit</h3>
                                    <p className="text-xs text-muted-foreground">How well you complement each other</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{complementaryScore}%</span>
                        </div>
                        <Progress value={complementaryScore} className="h-2" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your project needs <span className="font-semibold text-foreground">backend leadership</span> and {match.name} has <span className="font-semibold text-foreground">fintech + cloud expertise</span>.
                        </p>
                    </div>

                    {/* Shared Interests */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Shared Interests</h3>
                                    <p className="text-xs text-muted-foreground">Common goals and focus areas</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{sharedInterests}%</span>
                        </div>
                        <Progress value={sharedInterests} className="h-2" />
                        <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                Fintech
                            </Badge>
                            <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                Startup Stage
                            </Badge>
                            <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-800">
                                MVP Building
                            </Badge>
                        </div>
                    </div>

                    {/* AI Explanation */}
                    <Alert className="border-primary/20 bg-primary/5">
                        <Brain className="h-5 w-5 text-primary" />
                        <AlertDescription className="ml-8 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">AI Confidence:</span>
                                <span className="text-lg font-bold text-primary">{aiConfidence}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">Matched because</span> your project needs backend leadership and {match.name} has proven fintech + cloud infrastructure expertise. Strong role-technical alignment with complementary skill sets.
                            </p>
                        </AlertDescription>
                    </Alert>

                    {/* Match Breakdown Legend */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">How We Calculate Matches</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>Semantic analysis of skills, bio, and project descriptions</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>Vector similarity scoring with 768-dimensional embeddings</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>Weighted by availability, project stage, and role requirements</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
