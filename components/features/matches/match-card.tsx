"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles, UserPlus, Info } from "lucide-react"
import { useState } from "react"
import { WhyMatchModal } from "./why-match-modal"

interface MatchCardProps {
    match: {
        id: string
        name: string
        role: string
        avatar: string
        compatibility: number
        skills: string[]
        bio: string
        insights?: {
            type: "complementary" | "shared" | "similar"
            text: string
        }[]
    }
    index?: number
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
    const [whyModalOpen, setWhyModalOpen] = useState(false)
    const [requestSent, setRequestSent] = useState(false)

    const isStrongMatch = match.compatibility >= 90
    const isLowMatch = match.compatibility < 80

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                className="h-full"
            >
                <Card className={`group relative h-full overflow-hidden border bg-card transition-all duration-300 hover:shadow-md hover:border-primary ${isLowMatch ? "opacity-75" : ""
                    }`}>
                    <div className="relative flex flex-col h-full p-4 sm:p-5 lg:p-6">
                        {/* Header */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                <div className="relative rounded-full p-1 ring-2 ring-border transition-all duration-300 group-hover:ring-primary">
                                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                                        <AvatarImage src={match.avatar} alt={match.name} className="object-cover" />
                                        <AvatarFallback className="text-xl sm:text-2xl font-bold bg-muted">
                                            {match.name.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-border">
                                    <span className="text-base sm:text-lg">✨</span>
                                </div>
                            </div>

                            <h3 className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                {match.name}
                            </h3>
                            <p className="mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-muted-foreground">
                                {match.role}
                            </p>

                            {/* Role Fit Badge */}
                            {isStrongMatch && (
                                <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900 text-xs font-medium mb-2">
                                    ✅ Strong CTO Fit
                                </Badge>
                            )}
                        </div>

                        {/* Compatibility Meter - Clickable */}
                        <div
                            onClick={() => setWhyModalOpen(true)}
                            className="mb-4 sm:mb-6 space-y-2 sm:space-y-3 rounded-xl bg-muted p-3 sm:p-4 cursor-pointer hover:bg-muted/80 transition-colors group/score"
                        >
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-muted-foreground">
                                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                                    <span>Match Score</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-primary">{match.compatibility}%</span>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground group-hover/score:text-primary transition-colors" />
                                </div>
                            </div>
                            <Progress value={match.compatibility} className="h-2 bg-background" />

                            {/* AI Insights */}
                            {match.insights && match.insights.length > 0 && (
                                <div className="pt-2 space-y-1.5">
                                    {match.insights.map((insight, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span className="font-medium text-muted-foreground">
                                                {insight.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="mb-4 sm:mb-6 flex flex-wrap justify-center gap-1.5">
                            {match.skills.slice(0, 4).map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="bg-secondary text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary border-transparent border"
                                >
                                    {skill}
                                </Badge>
                            ))}
                            {match.skills.length > 4 && (
                                <Badge variant="outline" className="text-xs border-dashed text-muted-foreground/70">
                                    +{match.skills.length - 4}
                                </Badge>
                            )}
                        </div>

                        {/* Bio */}
                        <p className="flex-1 text-center text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-4 sm:mb-6 px-1 sm:px-2">
                            "{match.bio}"
                        </p>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
                            {!requestSent ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="h-9 sm:h-10 text-xs sm:text-sm hover:bg-primary hover:text-primary-foreground transition-all"
                                        onClick={() => setRequestSent(true)}
                                    >
                                        <UserPlus className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                        Connect
                                    </Button>
                                    <Button
                                        className="h-9 sm:h-10 text-xs sm:text-sm shadow-sm transition-all hover:-translate-y-0.5"
                                    >
                                        <MessageSquare className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                        Message
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    disabled
                                    className="col-span-2 h-9 sm:h-10 text-xs sm:text-sm cursor-not-allowed opacity-75"
                                >
                                    ⏳ Request Sent
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Why Match Modal */}
            <WhyMatchModal
                open={whyModalOpen}
                onOpenChange={setWhyModalOpen}
                match={match}
            />
        </>
    )
}
