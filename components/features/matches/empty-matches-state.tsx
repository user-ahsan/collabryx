"use client"

import { Button } from "@/components/ui/button"
import { SearchX, Sparkles } from "lucide-react"

interface EmptyMatchesStateProps {
    onUpdatePreferences?: () => void
}

export function EmptyMatchesState({ onUpdatePreferences }: EmptyMatchesStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="h-24 w-24 mb-6 bg-muted rounded-full flex items-center justify-center">
                <SearchX className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
                No matches found
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
                Try refining your preferences or adding more project details to help our AI find better matches.
            </p>
            <Button onClick={onUpdatePreferences} size="lg" className="shadow-sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Update Preferences
            </Button>
        </div>
    )
}
