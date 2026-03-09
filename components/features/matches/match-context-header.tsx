"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Settings2 } from "lucide-react"
import { motion } from "framer-motion"
import { UpdatePreferencesDialog } from "./update-preferences-dialog"
import { GlassCard } from "@/components/shared/glass-card"

interface MatchContextHeaderProps {
    preferences?: {
        role?: string
        industry?: string
        type?: string
    }
    onUpdatePreferences?: (prefs: { role: string; industry: string; type: string }) => void
    matchCount?: number
}

export function MatchContextHeader({
    preferences = {
        role: "CTO",
        industry: "Fintech",
        type: "Startup"
    },
    onUpdatePreferences,
    matchCount = 0
}: MatchContextHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 w-full"
        >
            <GlassCard innerClassName="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Title and Match Count */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground shrink-0">
                            <span className="hidden sm:inline">Matches for </span>
                            <span className="text-primary">{preferences.role}</span>
                            <span className="hidden sm:inline text-muted-foreground font-medium"> · </span>
                            <span className="hidden sm:inline text-primary">{preferences.industry}</span>
                        </h1>
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shrink-0">
                            <Sparkles className="mr-1.5 h-3 w-3" />
                            <span>{matchCount} found</span>
                        </div>
                    </div>

                    {/* Update Preferences Icon Button */}
                    <UpdatePreferencesDialog
                        currentPreferences={preferences}
                        onUpdate={(newPrefs) => onUpdatePreferences?.(newPrefs)}
                        variant="icon"
                    />
                </div>
            </GlassCard>
        </motion.div>
    )
}
