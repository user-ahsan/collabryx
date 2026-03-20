"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ComboboxOption {
  id: string
  label: string
  description?: string
  category?: string
  keywords?: string[]
}

interface SearchableComboboxProps {
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

export function SearchableCombobox({
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
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
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
      setOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim() && allowCustom && onAddCustom) {
      e.preventDefault()
      handleAddCustom()
    }
  }

  // Get selected option details
  const selectedOptions = options.filter(opt => selected.includes(opt.id))

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md border border-border bg-background">
          {selectedOptions.map(option => (
            <Badge
              key={option.id}
              variant="secondary"
              className="px-3 py-1 text-sm gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-none"
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => handleRemove(option.id, e)}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 bg-background border-border hover:bg-accent/50"
          >
            <span className="text-muted-foreground">
              {selected.length === 0 ? placeholder : `${selected.length} selected`}
            </span>
            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0" 
          align="start" 
          style={{ maxHeight: `${maxHeight + 100}px` }}
          sideOffset={8}
        >
          <Command shouldFilter={false} className="w-full">
            <div className="flex items-center border-b border-border">
              <CommandInput
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="h-12"
              />
              {allowCustom && onAddCustom && search.trim() && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddCustom}
                  className="h-8 px-3 rounded-md m-2 hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add "{search.trim()}"
                </Button>
              )}
            </div>
            <CommandList className="max-h-[300px]">
              <ScrollArea className="h-full">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
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
                              className="gap-2 cursor-pointer py-3 aria-selected:bg-primary/10 aria-selected:text-primary"
                            >
                              <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selected.includes(option.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{option.label}</span>
                                {option.description && (
                                  <span className="text-xs text-muted-foreground">{option.description}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}
                    {!showCategories && (
                      <CommandGroup>
                        {categoryOptions.map(option => (
                          <CommandItem
                            key={option.id}
                            value={option.id}
                            onSelect={() => handleSelect(option.id)}
                            className="gap-2 cursor-pointer py-3 aria-selected:bg-primary/10 aria-selected:text-primary"
                          >
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selected.includes(option.id)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{option.label}</span>
                              {option.description && (
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </React.Fragment>
                ))}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {allowCustom ? "Type to search or add custom option" : "Select from the list above"}
      </p>
    </div>
  )
}
