"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2 } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SemanticSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSearch: (projectDetails: string, userBio: string) => void
}

export function SemanticSearchDialog({
    open,
    onOpenChange,
    onSearch,
}: SemanticSearchDialogProps) {
    const [loading, setLoading] = useState(false)
    const [projectDetails, setProjectDetails] = useState(
        "I'm building a fintech app for stock tracking. We need a technical co-founder to handle the backend and security."
    )
    const [userBio, setUserBio] = useState(
        "I'm a CS junior with a focus on finance. I have some frontend experience but need a strong partner."
    )

    const handleSearch = () => {
        setLoading(true)
        // Simulate AI processing
        setTimeout(() => {
            setLoading(false)
            onSearch(projectDetails, userBio)
            onOpenChange(false)
        }, 1500)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] overflow-hidden border-primary/20 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Semantic Search
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        Describe your project and role to find the perfect match based on meaning, goals, and context.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project" className="text-sm font-semibold">
                            Project / Company Vision
                        </Label>
                        <Textarea
                            id="project"
                            value={projectDetails}
                            onChange={(e) => setProjectDetails(e.target.value)}
                            className="min-h-[100px] bg-muted/50 resize-none focus:bg-background transition-colors"
                            placeholder="Describe what you're building..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-semibold">
                            Your Role & Context
                        </Label>
                        <Textarea
                            id="bio"
                            value={userBio}
                            onChange={(e) => setUserBio(e.target.value)}
                            className="min-h-[100px] bg-muted/50 resize-none focus:bg-background transition-colors"
                            placeholder="Describe your background and what you bring to the table..."
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button onClick={handleSearch} disabled={loading} className="min-w-[140px] w-full sm:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Find Matches
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
