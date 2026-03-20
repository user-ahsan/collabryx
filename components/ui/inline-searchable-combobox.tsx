"use client"

import * as React from "react"
import { Check, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ComboboxOption {
  id: string
  label: string
  description?: string
  category?: string
  keywords?: string[]
}

interface InlineSearchableComboboxProps {
  options: ComboboxOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  maxHeight?: number
  allowCustom?: boolean
  onAddCustom?: (value: string) => void
  showCategories?: boolean
  className?: string
}

export function InlineSearchableCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  maxHeight = 300,
  allowCustom = true,
  onAddCustom,
  showCategories = true,
  className,
}: InlineSearchableComboboxProps) {
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Group options by category
  const groupedOptions = React.useMemo(() => {
    if (!showCategories) {
      return { "All": options }
    }
    
    return options.reduce((acc, option) => {
      const category = option.category || "Other"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(option)
      return acc
    }, {} as Record<string, ComboboxOption[]>)
  }, [options, showCategories])

  // Filter options based on search
  const filteredGroups = React.useMemo(() => {
    if (!search) {
      return groupedOptions
    }

    const lowerSearch = search.toLowerCase()
    const filtered: Record<string, ComboboxOption[]> = {}

    Object.entries(groupedOptions).forEach(([category, categoryOptions]) => {
      const matchingOptions = categoryOptions.filter(option =>
        option.label.toLowerCase().includes(lowerSearch) ||
        option.description?.toLowerCase().includes(lowerSearch) ||
        option.keywords?.some(keyword => keyword.toLowerCase().includes(lowerSearch))
      )

      if (matchingOptions.length > 0) {
        filtered[category] = matchingOptions
      }
    })

    return filtered
  }, [groupedOptions, search])

  const handleSelect = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter(id => id !== optionId))
    } else {
      onChange([...selected, optionId])
    }
  }

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter(id => id !== optionId))
  }

  const handleAddCustom = () => {
    if (search.trim() && allowCustom && onAddCustom) {
      onAddCustom(search.trim())
      setSearch("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (search.trim() && allowCustom && onAddCustom) {
        handleAddCustom()
      }
    }
  }

  // Get selected option details
  const selectedOptions = options.filter(opt => selected.includes(opt.id))

  return (
    <div className={cn("w-full space-y-3", className)} role="group">
      {/* Selected items */}
      {selected.length > 0 && (
        <div 
          className={cn(
            "flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg",
            glass("subtle")
          )}
          role="list"
          aria-label="Selected options"
        >
          {selectedOptions.map(option => (
            <Badge
              key={option.id}
              variant="secondary"
              className="px-3 py-1 text-sm gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-none"
              role="listitem"
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => handleRemove(option.id, e)}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                aria-label={`Remove ${option.label}`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className={cn(
            "h-12 text-base pr-12 transition-all duration-300",
            glass("input")
          )}
          aria-autocomplete="list"
          aria-controls="combobox-dropdown"
          aria-expanded={!!search}
        />
        {allowCustom && onAddCustom && search.trim() && (
          <button
            type="button"
            onClick={handleAddCustom}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
              glass("buttonPrimary")
            )}
            aria-label="Add custom option"
            title="Add custom option"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {search && (
        <div 
          id="combobox-dropdown"
          className={cn(
            "relative w-full overflow-hidden rounded-xl shadow-lg",
            glass("overlay")
          )}
          style={{ maxHeight: `${maxHeight}px` }}
          role="listbox"
          aria-label="Available options"
        >
          <Command shouldFilter={false} className="w-full">
            <CommandList className="h-full" role="presentation">
              <ScrollArea className="h-full" type="always">
                <div className="min-h-fit">
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground" role="status">
                    {emptyMessage}
                  </CommandEmpty>
                  {Object.entries(filteredGroups).map(([category, categoryOptions]) => (
                    <React.Fragment key={category}>
                      {showCategories && Object.keys(filteredGroups).length > 1 && (
                        <>
                          <CommandGroup heading={category}>
                            {categoryOptions.map(option => (
                              <CommandItem
                                key={option.id}
                                value={option.id}
                                onSelect={() => handleSelect(option.id)}
                                className={cn(
                                  "gap-2 cursor-pointer py-3 aria-selected:bg-primary/10 aria-selected:text-primary",
                                  glass("dropdownItem")
                                )}
                                role="option"
                                aria-selected={selected.includes(option.id)}
                              >
                                <div className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  selected.includes(option.id)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )} aria-hidden="true">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate">{option.label}</span>
                                  {option.description && (
                                    <span className="text-xs text-muted-foreground truncate">{option.description}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator className={cn("my-1", glass("divider"))} />
                        </>
                      )}
                      {!showCategories && (
                        <CommandGroup>
                          {categoryOptions.map(option => (
                            <CommandItem
                              key={option.id}
                              value={option.id}
                              onSelect={() => handleSelect(option.id)}
                              className={cn(
                                "gap-2 cursor-pointer py-3 aria-selected:bg-primary/10 aria-selected:text-primary",
                                glass("dropdownItem")
                              )}
                              role="option"
                              aria-selected={selected.includes(option.id)}
                            >
                              <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selected.includes(option.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )} aria-hidden="true">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium truncate">{option.label}</span>
                                {option.description && (
                                  <span className="text-xs text-muted-foreground truncate">{option.description}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            </CommandList>
          </Command>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {allowCustom ? "Type to search or add custom option (press Enter)" : "Select from the list above"}
      </p>
    </div>
  )
}
