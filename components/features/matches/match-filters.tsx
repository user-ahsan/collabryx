"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal, LayoutGrid, List, Sparkles } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import { useState } from "react"
import { SemanticSearchDialog } from "./semantic-search-dialog"

type ViewMode = "grid" | "list"

interface MatchFiltersProps {
    matchCount?: number
    viewMode?: ViewMode
    onViewModeChange?: (mode: ViewMode) => void
}

export function MatchFilters({
    matchCount = 0,
    viewMode = "grid",
    onViewModeChange
}: MatchFiltersProps) {
    const [semanticSearchOpen, setSemanticSearchOpen] = useState(false)

    return (
        <>
            <div className="mb-4 w-full">
                <GlassCard innerClassName="p-2 sm:p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        {/* Natural Language Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by skills, interests, or role..."
                                className="h-10 pl-9 pr-20 w-full text-sm"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => setSemanticSearchOpen(true)}
                            >
                                <Sparkles className="mr-1 h-3 w-3" />
                                AI
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Role Filter */}
                            <Select defaultValue="all">
                                <SelectTrigger className="h-10 w-[130px] text-xs sm:text-sm hidden md:flex">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="developer">Developer</SelectItem>
                                    <SelectItem value="designer">Designer</SelectItem>
                                    <SelectItem value="manager">Product Manager</SelectItem>
                                    <SelectItem value="founder">Founder</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Availability Filter */}
                            <Select defaultValue="any">
                                <SelectTrigger className="h-10 w-[130px] text-xs sm:text-sm hidden lg:flex">
                                    <SelectValue placeholder="Availability" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any Availability</SelectItem>
                                    <SelectItem value="fulltime">Full-time</SelectItem>
                                    <SelectItem value="parttime">Part-time</SelectItem>
                                    <SelectItem value="hackathon">Hackathon</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Advanced Filter Toggle */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 flex lg:hidden"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 p-1 rounded-lg border bg-background">
                                <Button
                                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => onViewModeChange?.("grid")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => onViewModeChange?.("list")}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <SemanticSearchDialog
                open={semanticSearchOpen}
                onOpenChange={setSemanticSearchOpen}
                onSearch={(project, bio) => {
                    console.log("Searching with:", { project, bio })
                }}
            />
        </>
    )
}
