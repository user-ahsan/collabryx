"use client"

import * as React from "react"
import { Check, Search, X, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ComboboxOption } from "@/components/ui/searchable-combobox"

interface TagSelectorCardProps {
  options: ComboboxOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  emptyMessage?: string
  title?: string
  showCategories?: boolean
  maxHeight?: number
  // When true, only one option can be selected at a time
  singleSelect?: boolean
}

/**
 * TagSelectorCard - Searchable pill-based multi-select component used in the onboarding flow.
 *
 * FIXES APPLIED:
 *
 * 1. NESTED SCROLL ON MOBILE — The options list had a fixed pixel maxHeight (400px default)
 *    with `overflow-y-auto`. On mobile viewports (typically 667-896px tall), a 400px scrollable
 *    box inside a scrolling page creates a nested scroll trap: the user scrolls the page, hits
 *    the card, and their scroll gestures are captured by the inner scroll container. This is
 *    disorienting and makes the interface feel broken. Changed to `min(400px, 50vh)` which caps
 *    the height at half the viewport on small screens while keeping the full 400px on desktop.
 *
 * 2. TOUCH SCROLLING — Added `touch-pan-y` to prevent touch event conflicts with the browser's
 *    native scroll. Without this, iOS Safari in particular would sometimes refuse to scroll
 *    the inner container because the touch events were ambiguous.
 *
 * 3. CUSTOM SCROLLBAR — Added thin scrollbar styling via Tailwind's arbitrary variant syntax
 *    for WebKit browsers. The default scrollbar is visually heavy and clashes with the
 *    glass-morphism aesthetic. The thin 6px scrollbar with 50% opacity border-color blends
 *    into the card background while remaining functional.
 */
export function TagSelectorCard({
  options,
  selected,
  onChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  title = "Select Options",
  showCategories = true,
  maxHeight = 400,
  singleSelect = false,
}: TagSelectorCardProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set())

  // Group options by category
  const groupedOptions = React.useMemo(() => {
    if (!showCategories) {
      return { All: options }
    }
    return options.reduce((acc, option) => {
      const category = option.category || "Other"
      if (!acc[category]) acc[category] = []
      acc[category].push(option)
      return acc
    }, {} as Record<string, ComboboxOption[]>)
  }, [options, showCategories])

  // Filter options based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchValue) return groupedOptions
    const lowerSearch = searchValue.toLowerCase()
    const filtered: Record<string, ComboboxOption[]> = {}
    Object.entries(groupedOptions).forEach(([category, categoryOptions]) => {
      const matching = categoryOptions.filter((opt) =>
        opt.label.toLowerCase().includes(lowerSearch) ||
        opt.description?.toLowerCase().includes(lowerSearch) ||
        opt.keywords?.some((kw) => kw.toLowerCase().includes(lowerSearch))
      )
      if (matching.length > 0) filtered[category] = matching
    })
    return filtered
  }, [groupedOptions, searchValue])

  const handleToggle = (optionId: string) => {
    if (selected.includes(optionId)) {
      // Deselect
      onChange(selected.filter((id) => id !== optionId))
    } else {
      // Select
      if (singleSelect) {
        // Replace any existing selection with this one
        onChange([optionId])
      } else {
        onChange([...selected, optionId])
      }
    }
  }

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const totalFiltered = Object.values(filteredGroups).reduce((sum, opts) => sum + opts.length, 0)

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full rounded-2xl overflow-hidden",
        "border border-border/60 shadow-xl",
        "bg-card/95 backdrop-blur-xl",
        "transition-all duration-200",
        "touch-pan-y"
      )}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {selected.length} selected · {totalFiltered} options
        </span>
      </div>

      {/* Search */}
      <div className="shrink-0 px-3 py-2 border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full h-10 pl-10 pr-8 rounded-lg text-sm",
              "bg-muted/40 border border-border/30",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
              "transition-all duration-200"
            )}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Options List */}
      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50"
        style={{ maxHeight: `min(${maxHeight}px, 50vh)` }}
      >
        {totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {Object.entries(filteredGroups).map(([category, categoryOptions]) => {
              const isCollapsed = collapsedCategories.has(category)
              const categorySelected = categoryOptions.filter((o) => selected.includes(o.id)).length

              return (
                <div key={category} className="space-y-1">
                  {/* Category Header */}
                  {showCategories && Object.keys(filteredGroups).length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors",
                        "group"
                      )}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                      )}
                      <span>{category}</span>
                      <span className="ml-auto text-[10px] font-normal tabular-nums opacity-60">
                        {categorySelected}/{categoryOptions.length}
                      </span>
                    </button>
                  )}

                  {/* Category Options as Pills */}
                  {!isCollapsed && (
                    <div className="flex flex-wrap gap-1.5 pl-2">
                      {categoryOptions.map((option) => {
                        const isSelected = selected.includes(option.id)
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleToggle(option.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                              "border transition-all duration-150",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              isSelected
                                ? "bg-primary/15 border-primary/30 text-primary shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                                : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50 hover:border-border/60 hover:text-foreground"
                            )}
                            title={option.description}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span className="truncate max-w-[160px]">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer - Selected count */}
      {selected.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-t border-border/20 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{selected.length}</span> option{selected.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  )
}
