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
import { Sparkle as Sparkles, Brain, Users, ArrowsCounterClockwise } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface WhyMatchModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    match: {
        name: string
        compatibility: number
        skills: string[]
        role: string
        reasons?: string[]
    }
}

export function WhyMatchModal({ open, onOpenChange, match }: WhyMatchModalProps) {
    // Parse match reasons to determine what kind of match this is
    const reasons = match.reasons || []
    const isComplementary = reasons.some(r =>
        r.toLowerCase().includes('skill gap') ||
        r.toLowerCase().includes('complement') ||
        r.toLowerCase().includes('cross-domain') ||
        r.toLowerCase().includes('role match')
    )
    const isSimilar = reasons.some(r =>
        r.toLowerCase().includes('shared') ||
        r.toLowerCase().includes('similar') ||
        r.toLowerCase().includes('overlap')
    )

    // Calculate mock breakdown (in real app, this comes from match_scores table)
    const skillGapScore = isComplementary ? Math.min(95, match.compatibility + 5) : Math.max(40, match.compatibility - 20)
    const complementaryScore = isComplementary ? Math.min(92, match.compatibility + 2) : Math.max(30, match.compatibility - 30)
    const roleComplementarity = isComplementary ? Math.min(88, match.compatibility) : Math.max(35, match.compatibility - 25)
    const sharedInterests = isSimilar ? Math.min(90, match.compatibility) : Math.max(30, match.compatibility - 15)
    const aiConfidence = (match.compatibility / 100).toFixed(2)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto sm:rounded-2xl",
                glass("overlay")
            )}>
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" weight="fill" />
                        Why {match.name}?
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        {isComplementary
                            ? `A complementary match — your skills fill each other's gaps`
                            : `Here's how our AI calculated this ${match.compatibility}% match`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Skill Gap — NEW primary dimension for complementary matching */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-sm",
                                    glass("badge")
                                )}>
                                    <ArrowsCounterClockwise className="h-4 w-4 text-pink-400" weight="bold" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Skill Gap Coverage</h3>
                                    <p className="text-xs text-muted-foreground">Skills they have that you don&apos;t</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-pink-500 dark:text-pink-400">{skillGapScore}%</span>
                        </div>
                        <Progress value={skillGapScore} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-purple-500" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {isComplementary
                                ? `${match.name} brings skills in areas where your profile has gaps. Together you cover more ground than apart.`
                                : `You and ${match.name} have overlapping skill sets. For a stronger complementary match, look for partners with different expertise.`
                            }
                        </p>
                    </div>

                    {/* Role Complementarity — NEW dimension */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-sm",
                                    glass("badge")
                                )}>
                                    <Users className="h-4 w-4 text-purple-400" weight="bold" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Role Complementarity</h3>
                                    <p className="text-xs text-muted-foreground">Cross-domain collaboration potential</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-purple-500 dark:text-purple-400">{roleComplementarity}%</span>
                        </div>
                        <Progress value={roleComplementarity} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-violet-500" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {isComplementary
                                ? `Your ${match.role ? `role (${match.role})` : 'profile'} and ${match.name}'s background create strong cross-domain synergy.`
                                : `You and ${match.name} work in similar domains — consider seeking partners from different fields for broader coverage.`
                            }
                        </p>
                    </div>

                    {/* Complementary Skills */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" weight="bold" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Complementary Fit</h3>
                                    <p className="text-xs text-muted-foreground">How well you complement each other</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{complementaryScore}%</span>
                        </div>
                        <Progress value={complementaryScore} className="h-2" />
                        <div className="flex flex-wrap gap-1.5">
                            {match.skills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Shared Interests */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-amber-100 dark:bg-amber-950 rounded-lg flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Shared Interests</h3>
                                    <p className="text-xs text-muted-foreground">Common goals and focus areas</p>
                                </div>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{sharedInterests}%</span>
                        </div>
                        <Progress value={sharedInterests} className="h-2" />
                    </div>

                    {/* AI Explanation */}
                    <Alert className="border-primary/20 bg-primary/5">
                        <Brain className="h-5 w-5 text-primary" weight="fill" />
                        <AlertDescription className="ml-8 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">AI Confidence:</span>
                                <span className="text-lg font-bold text-primary">{aiConfidence}</span>
                            </div>
                            {reasons.length > 0 && (
                                <div className="space-y-1">
                                    <span className="text-sm font-semibold text-foreground">Match reasons:</span>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {reasons.slice(0, 4).map((reason, i) => (
                                            <li key={i}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>

                    {/* Match Algorithm Explanation */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">How We Calculate Matches</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                                <span><strong>Skill Gap (35%):</strong> Skills the other person has that you&apos;re missing</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                <span><strong>Role Complementarity (25%):</strong> Cross-domain synergy (e.g., frontend + backend)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                <span><strong>Complementary Skills (20%):</strong> How well your skill sets fill each other</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <span><strong>Semantic (10%):</strong> Vector embedding similarity</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <span><strong>Shared Interests (10%):</strong> Common topics and focus areas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
