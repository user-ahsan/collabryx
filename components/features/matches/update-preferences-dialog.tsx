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

interface UpdatePreferencesDialogProps {
    currentPreferences: {
        role?: string
        industry?: string
        type?: string
    }
    onUpdate: (prefs: { role: string; industry: string; type: string }) => void
    variant?: "button" | "icon"
}

export function UpdatePreferencesDialog({
    currentPreferences,
    onUpdate,
    variant = "button",
}: UpdatePreferencesDialogProps) {
    const [open, setOpen] = useState(false)
    const [role, setRole] = useState(currentPreferences.role || "CTO")
    const [industry, setIndustry] = useState(currentPreferences.industry || "Fintech")
    const [type, setType] = useState(currentPreferences.type || "Startup")

    const handleSave = () => {
        onUpdate({ role, industry, type })
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
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px] p-0 border-none bg-transparent shadow-none [&>button]:hidden sm:[&>button]:flex">
                <GlassCard innerClassName="p-6 pt-10 sm:pt-6 relative">
                    <DialogHeader>
                        <DialogTitle>Update Match Preferences</DialogTitle>
                        <DialogDescription>
                            Refine your search criteria to find the perfect matches for your project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                            <Label htmlFor="role" className="sm:text-right">
                                Role
                            </Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="col-span-1 sm:col-span-3">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CTO">CTO</SelectItem>
                                    <SelectItem value="Co-Founder">Co-Founder</SelectItem>
                                    <SelectItem value="Developer">Developer</SelectItem>
                                    <SelectItem value="Designer">Designer</SelectItem>
                                    <SelectItem value="Product Manager">Product Manager</SelectItem>
                                    <SelectItem value="AI Researcher">AI Researcher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                            <Label htmlFor="industry" className="sm:text-right">
                                Industry
                            </Label>
                            <Input
                                id="industry"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="col-span-1 sm:col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                            <Label htmlFor="type" className="sm:text-right">
                                Type
                            </Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="col-span-1 sm:col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Startup">Startup</SelectItem>
                                    <SelectItem value="Scale-up">Scale-up</SelectItem>
                                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                                    <SelectItem value="Consultancy">Consultancy</SelectItem>
                                    <SelectItem value="Project">Project</SelectItem>
                                </SelectContent>
                            </Select>
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
