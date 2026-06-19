"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Settings2 } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { Switch } from "@/components/ui/switch"
import type { Role } from "@/types/database.types"

const ALL_ROLES: { value: Role; label: string }[] = [
    { value: 'student', label: 'Students' },
    { value: 'investor', label: 'Investors' },
    { value: 'founder', label: 'Founders' },
    { value: 'professional', label: 'Professionals' },
    { value: 'mentor', label: 'Mentors' },
]

interface PreferencesData {
    minMatchPercentage: number
    interestedInTypes: string[]
    availabilityMatch: string
    roleMatchingEnabled: boolean
}

interface UpdatePreferencesDialogProps {
    currentPreferences: PreferencesData
    onUpdate: (prefs: PreferencesData) => void
    variant?: "button" | "icon"
}

export function UpdatePreferencesDialog({
    currentPreferences,
    onUpdate,
    variant = "button",
}: UpdatePreferencesDialogProps) {
    const [open, setOpen] = useState(false)

    const [interestedInTypes, setInterestedInTypes] = useState<string[]>(
        currentPreferences.interestedInTypes.length > 0
            ? currentPreferences.interestedInTypes
            : ALL_ROLES.map(r => r.value)
    )
    const [minMatchPercentage, setMinMatchPercentage] = useState(
        currentPreferences.minMatchPercentage || 50
    )
    const [availabilityMatch, setAvailabilityMatch] = useState(
        currentPreferences.availabilityMatch || 'any'
    )
    const [roleMatchingEnabled, setRoleMatchingEnabled] = useState(
        currentPreferences.roleMatchingEnabled !== false
    )

    const toggleRoleType = (role: string) => {
        setInterestedInTypes(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        )
    }

    const handleSave = () => {
        onUpdate({
            interestedInTypes:
                interestedInTypes.length === ALL_ROLES.length
                    ? []
                    : interestedInTypes,
            minMatchPercentage,
            availabilityMatch,
            roleMatchingEnabled,
        })
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === "icon" ? (
                    <Button variant="outline" size="icon" className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="outline" size="lg" className="px-4 sm:px-6 text-xs sm:text-sm border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors w-full md:w-auto">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Update Preferences
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={cn("w-[95vw] sm:w-full sm:max-w-[425px] sm:rounded-2xl", glass("overlay"))}>
                <GlassCard innerClassName="p-6 pt-10 sm:pt-6 relative">
                    <DialogHeader>
                        <DialogTitle>Match Preferences</DialogTitle>
                        <DialogDescription>
                            Control who you match with and how matches are scored.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        {/* Who do you want to match with? */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">I want to match with</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {ALL_ROLES.map(({ value, label }) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        variant={interestedInTypes.includes(value) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleRoleType(value)}
                                        className={`text-xs h-9 ${interestedInTypes.includes(value) ? '' : 'border-border/50'}`}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {interestedInTypes.length === 0 || interestedInTypes.length === ALL_ROLES.length
                                    ? "All role types (no filter)"
                                    : `Only matching with: ${interestedInTypes.map(t => ALL_ROLES.find(r => r.value === t)?.label || t).join(', ')}`
                                }
                            </p>
                        </div>

                        {/* Minimum match percentage */}
                        <div className="space-y-2">
                            <Label htmlFor="minScore" className="text-sm font-medium">
                                Minimum match score: {minMatchPercentage}%
                            </Label>
                            <Input
                                id="minScore"
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={minMatchPercentage}
                                onChange={(e) => setMinMatchPercentage(parseInt(e.target.value))}
                                className="h-2"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Availability match */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="availability" className="text-sm font-medium col-span-4 sm:col-span-2">
                                Availability matching
                            </Label>
                            <Select value={availabilityMatch} onValueChange={setAvailabilityMatch}>
                                <SelectTrigger className="col-span-4 sm:col-span-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any availability</SelectItem>
                                    <SelectItem value="similar">Similar only</SelectItem>
                                    <SelectItem value="complementary">Complementary only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Role-based matching toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="roleMatching" className="text-sm font-medium">
                                    Role-based matching
                                </Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Boosts matches between complementary roles (founder↔investor, etc.)
                                </p>
                            </div>
                            <Switch
                                id="roleMatching"
                                checked={roleMatchingEnabled}
                                onCheckedChange={setRoleMatchingEnabled}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSave}>Save changes</Button>
                    </DialogFooter>
                </GlassCard>
            </DialogContent>
        </Dialog>
    )
}
