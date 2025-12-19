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
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

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
    return (
        <div className="mb-6 sm:mb-8 w-full rounded-lg sm:rounded-xl border bg-card p-3 sm:p-4 shadow-sm">
            {/* Header with Match Count and View Toggle */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        {matchCount} {matchCount === 1 ? 'match' : 'matches'} found
                    </h2>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg border bg-background">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs sm:text-sm"
                        onClick={() => onViewModeChange?.("grid")}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs sm:text-sm"
                        onClick={() => onViewModeChange?.("list")}
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Describe who you are looking for... (e.g., a designer with Figma skills for a SaaS product)"
                        className="h-10 pl-9 w-full text-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Role Filter */}
                    <Select defaultValue="all">
                        <SelectTrigger className="h-10 w-full sm:min-w-[140px] sm:w-auto text-xs sm:text-sm">
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
                        <SelectTrigger className="h-10 w-full sm:min-w-[140px] sm:w-auto text-xs sm:text-sm">
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
                        className="h-10 w-10 shrink-0 hidden sm:flex"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
