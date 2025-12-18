"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Settings2, ArrowRight, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { SemanticSearchDialog } from "./semantic-search-dialog"
import { UpdatePreferencesDialog } from "./update-preferences-dialog"

interface MatchContextHeaderProps {
    preferences?: {
        role?: string
        industry?: string
        type?: string
    }
    onUpdatePreferences?: (prefs: { role: string; industry: string; type: string }) => void
}

export function MatchContextHeader({
    preferences = {
        role: "CTO",
        industry: "Fintech",
        type: "Startup"
    },
    onUpdatePreferences
}: MatchContextHeaderProps) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mb-8 w-full overflow-hidden rounded-2xl border bg-card p-8 shadow-sm"
            >
                <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-4 max-w-2xl flex-1">
                        <div className="inline-flex items-center rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            <span>AI-Powered Recommendations</span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl leading-tight">
                                Suggestions for <span className="text-primary">{preferences.role}</span> for your <span className="text-primary">{preferences.industry}</span> {preferences.type}
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Matches are ranked using <span className="font-medium text-foreground">skills compatibility</span>, <span className="font-medium text-foreground">shared interests</span>, <span className="font-medium text-foreground">availability</span>, and <span className="font-medium text-foreground">project stage</span>.
                            </p>
                            <p className="text-base text-muted-foreground leading-relaxed pt-1">
                                We've analyzed your project requirements and found these candidates who match your technical needs and company culture.
                            </p>
                        </div>

                        {/* Search Input Trigger */}
                        <div className="pt-2 max-w-xl">
                            <div
                                onClick={() => setDialogOpen(true)}
                                className="group relative flex items-center w-full cursor-pointer rounded-xl border bg-background px-4 py-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                            >
                                <Search className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    e.g. "Backend-focused CTO with fintech & startup experience"
                                </span>
                                <div className="absolute right-3 rounded-lg bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                    Semantic Search
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-3">
                        <UpdatePreferencesDialog
                            currentPreferences={preferences}
                            onUpdate={(newPrefs) => onUpdatePreferences?.(newPrefs)}
                        />
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
