"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Settings2, ArrowRight, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { SemanticSearchDialog } from "./semantic-search-dialog"

interface MatchContextHeaderProps {
    preferences?: {
        role?: string
        industry?: string
        type?: string
    }
}

export function MatchContextHeader({
    preferences = {
        role: "CTO",
        industry: "Fintech",
        type: "Startup"
    }
}: MatchContextHeaderProps) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mb-8 w-full overflow-hidden rounded-2xl border bg-background/60 p-8 shadow-sm backdrop-blur-xl"
            >
                {/* Background Gradients */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-4 max-w-2xl flex-1">
                        <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-xs font-medium text-primary backdrop-blur-md">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            <span>AI-Powered Recommendations</span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl leading-tight">
                                Suggestions for <span className="text-primary">{preferences.role}</span> for your <span className="text-primary">{preferences.industry}</span> {preferences.type}
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                We've analyzed your project requirements and found these candidates who match your technical needs and company culture.
                            </p>
                        </div>

                        {/* Search Input Trigger */}
                        <div className="pt-2 max-w-xl">
                            <div
                                onClick={() => setDialogOpen(true)}
                                className="group relative flex items-center w-full cursor-pointer rounded-xl border bg-background/50 px-4 py-3 shadow-sm transition-all hover:bg-background/80 hover:shadow-md ring-offset-background hover:ring-2 hover:ring-primary/20"
                            >
                                <Search className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    Describe your ideal co-founder...
                                </span>
                                <div className="absolute right-3 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                    Semantic Search
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-3">
                        <Button variant="outline" className="h-11 px-6 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors">
                            <Settings2 className="mr-2 h-4 w-4" />
                            Update Preferences
                        </Button>
                    </div>
                </div>
            </motion.div>

            <SemanticSearchDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSearch={(project, bio) => {
                    console.log("Searching with:", { project, bio })
                    // In a real app, this would trigger a new search/filtering
                }}
            />
        </>
    )
}
