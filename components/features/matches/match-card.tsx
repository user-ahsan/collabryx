"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { MessageSquare, Sparkles, UserPlus } from "lucide-react"

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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
            className="h-full"
        >
            <Card className="group relative h-full overflow-hidden border bg-card transition-all duration-300 hover:shadow-md hover:border-primary">
                <div className="relative flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="relative rounded-full p-1 ring-2 ring-border transition-all duration-300 group-hover:ring-primary">
                                <Avatar className="h-28 w-28">
                                    <AvatarImage src={match.avatar} alt={match.name} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold bg-muted">
                                        {match.name.split(" ").map(n => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-border">
                                <span className="text-lg">✨</span>
                            </div>
                        </div>

                        <h3 className="mb-1 text-xl font-bold tracking-tight text-foreground">
                            {match.name}
                        </h3>
                        <p className="mb-4 text-sm font-medium text-muted-foreground">
                            {match.role}
                        </p>
                    </div>

                    {/* Compatibility Meter */}
                    <div className="mb-6 space-y-3 rounded-xl bg-muted p-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 font-medium text-muted-foreground">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span>Match Score</span>
                            </div>
                            <span className="font-bold text-primary">{match.compatibility}%</span>
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
                    <div className="mb-6 flex flex-wrap justify-center gap-1.5">
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
                    <p className="flex-1 text-center text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-6 px-2">
                        "{match.bio}"
                    </p>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <Button
                            variant="outline"
                            className="h-10 hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Connect
                        </Button>
                        <Button
                            className="h-10 shadow-sm transition-all hover:-translate-y-0.5"
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
