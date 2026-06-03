/**
 * InlineEditHeadline — lightweight inline headline editor for own profile
 *
 * PROBLEM SOLVED:
 * Previously, editing the profile headline required navigating to the Settings page,
 * finding the profile settings tab, scrolling to the headline field, editing, saving,
 * then navigating back. This friction discouraged users from keeping their headline
 * fresh, which directly impacts match quality (headline is weighted at 10% in
 * profile completion scoring and is a primary vector for AI matching signals).
 *
 * SOLUTION:
 * A click-to-edit pattern with a hover-reveal pencil icon: users see a subtle
 * pencil icon when hovering their headline, click it, and get an inline input
 * with Save/Cancel controls. The mutation uses React Query's useUpdateProfile hook
 * which handles optimistic updates, rollback on error, and automatic embedding
 * regeneration — all without a page navigation. Escape dismisses, Enter saves.
 *
 * WHY THIS PATTERN:
 * - Zero page navigation = minimal context switch
 * - Uses existing useUpdateProfile mutation (no new API surface)
 * - 120-char max enforced at input level (matches DB schema implicitly)
 * - Handles empty state: shows "Add a headline..." placeholder for incomplete profiles
 * - Graceful error handling: reverts to previous value on save failure
 * - Accessible: auto-focuses + selects text on edit start, keyboard shortcuts
 */
"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUpdateProfile } from "@/hooks/use-profile"

interface InlineEditHeadlineProps {
    initialHeadline: string | null | undefined
}

export function InlineEditHeadline({ initialHeadline }: InlineEditHeadlineProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialHeadline ?? "")
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const { mutateAsync: updateProfile } = useUpdateProfile()

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSave = async () => {
        const trimmed = value.trim()
        if (trimmed === (initialHeadline ?? "")) {
            setIsEditing(false)
            return
        }
        setIsSaving(true)
        try {
            await updateProfile({ headline: trimmed || undefined })
            setIsEditing(false)
        } catch {
            setValue(initialHeadline ?? "")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setValue(initialHeadline ?? "")
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave()
        if (e.key === "Escape") handleCancel()
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Full-stack developer @ Startup"
                    className="h-8 text-sm md:text-base"
                    maxLength={120}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={handleCancel}
                    disabled={isSaving}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="group flex items-center gap-2">
            <p className="text-sm md:text-base text-emerald-500/90 dark:text-emerald-400 font-medium">
                {initialHeadline || (
                    <span className="text-muted-foreground/50 italic">Add a headline...</span>
                )}
            </p>
            <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                title="Edit headline"
            >
                <Pencil className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
