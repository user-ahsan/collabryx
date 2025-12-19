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
                className="relative mb-6 sm:mb-8 w-full overflow-hidden rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 lg:p-8 shadow-sm"
            >
                <div className="relative flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3 sm:space-y-4 max-w-2xl flex-1">
                        <div className="inline-flex items-center rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            <span>AI-Powered Recommendations</span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
                                Suggestions for <span className="text-primary">{preferences.role}</span> for your <span className="text-primary">{preferences.industry}</span> {preferences.type}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Matches are ranked using <span className="font-medium text-foreground">skills compatibility</span>, <span className="font-medium text-foreground">shared interests</span>, <span className="font-medium text-foreground">availability</span>, and <span className="font-medium text-foreground">project stage</span>.
                            </p>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1 hidden sm:block">
                                We've analyzed your project requirements and found these candidates who match your technical needs and company culture.
                            </p>
                        </div>

                        {/* Search Input Trigger */}
                        <div className="pt-2 max-w-xl">
                            <div
                                onClick={() => setDialogOpen(true)}
                                className="group relative flex items-center w-full cursor-pointer rounded-lg sm:rounded-xl border bg-background px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                            >
                                <Search className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    e.g. "Backend-focused CTO with fintech & startup experience"
                                </span>
                                <div className="absolute right-2 sm:right-3 rounded-lg bg-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-secondary-foreground">
                                    Semantic Search
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-3 w-full md:w-auto">
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
