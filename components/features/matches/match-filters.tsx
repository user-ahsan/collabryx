"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { LayoutGrid, List, ArrowUpDown, Check, ChevronDown } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

type ViewMode = "grid" | "list"
type SortOption = "compatibility" | "name" | "role"

interface MatchFiltersProps {
    viewMode?: ViewMode
    onViewModeChange?: (mode: ViewMode) => void
    /** All unique skills extracted from fetched matches */
    skills?: string[]
    /** Currently selected skill filter (empty = all) */
    selectedSkill?: string
    onSkillChange?: (skill: string) => void
    /** Current sort option */
    sortBy?: SortOption
    onSortChange?: (sort: SortOption) => void
}

export function MatchFilters({
    viewMode = "grid",
    onViewModeChange,
    skills = [],
    selectedSkill = "",
    onSkillChange,
    sortBy = "compatibility",
    onSortChange,
}: MatchFiltersProps) {
    const [skillPopoverOpen, setSkillPopoverOpen] = useState(false)

    return (
        <div className="mb-4 w-full z-50">
            <GlassCard innerClassName="p-2 sm:p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {/* Skills Filter — searchable combobox, portal-rendered */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Popover open={skillPopoverOpen} onOpenChange={setSkillPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={skillPopoverOpen}
                                    className="h-9 w-full sm:w-[200px] justify-between text-xs font-normal"
                                >
                                    <span className="truncate">
                                        {selectedSkill
                                            ? selectedSkill
                                            : "Filter by skill..."}
                                    </span>
                                    <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[280px] p-0"
                                align="start"
                                sideOffset={4}
                            >
                                <Command>
                                    <CommandInput placeholder="Search skills..." />
                                    <CommandList>
                                        <CommandEmpty>No skill found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value=""
                                                onSelect={() => {
                                                    onSkillChange?.("")
                                                    setSkillPopoverOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-3.5 w-3.5",
                                                        !selectedSkill ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                All Skills
                                            </CommandItem>
                                            {skills.map((skill) => (
                                                <CommandItem
                                                    key={skill}
                                                    value={skill}
                                                    onSelect={() => {
                                                        onSkillChange?.(skill)
                                                        setSkillPopoverOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-3.5 w-3.5",
                                                            selectedSkill === skill ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {skill}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Sort By */}
                        <Select
                            value={sortBy}
                            onValueChange={(val) => onSortChange?.(val as SortOption)}
                        >
                            <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs">
                                <ArrowUpDown className="mr-1.5 h-3 w-3 shrink-0" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="compatibility">Best Match</SelectItem>
                                <SelectItem value="name">Name A-Z</SelectItem>
                                <SelectItem value="role">Role</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* View Toggle */}
                    <div className={cn(
                        "flex items-center gap-1 p-1 rounded-lg border self-start sm:self-auto",
                        glass("subtle")
                    )}>
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
            </GlassCard>
        </div>
    )
}
