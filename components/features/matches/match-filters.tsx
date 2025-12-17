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
import { Search, SlidersHorizontal } from "lucide-react"

export function MatchFilters() {
    return (
        <div className="mb-8 w-full rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, skill, or role..."
                        className="h-10 pl-9 w-full md:max-w-md"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Role Filter */}
                    <Select defaultValue="all">
                        <SelectTrigger className="h-10 w-full min-w-[140px] md:w-auto">
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

                    {/* Advanced Filter Toggle */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
