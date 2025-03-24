"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type CustomComboboxOption = {
  label: string
  value: string
  data?: any
}

interface CustomComboboxProps {
  options: CustomComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  popoverWidth?: number
  displayValue?: (value: string) => string
  onSearch?: (searchText: string) => void
}

export function CustomCombobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  popoverWidth,
  displayValue,
  onSearch,
}: CustomComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Function to determine what to display in the button
  const getDisplayValue = () => {
    // If custom display function is provided, use it
    if (displayValue && value) {
      return displayValue(value)
    }
    
    // Otherwise, find the label for the current value
    if (value) {
      const option = options.find(option => option.value === value)
      return option ? option.label : placeholder
    }
    
    // Default to placeholder
    return placeholder
  }

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  // Handle search query changes
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    if (onSearch) {
      onSearch(search)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 text-sm",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{getDisplayValue()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
        style={{ width: popoverWidth ? `${popoverWidth}px` : '100%' }}
      >
        <Command className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Buscar..." 
              onValueChange={handleSearchChange}
              className="h-9 flex-1 text-sm"
            />
          </div>
          {/* No CommandEmpty to hide "No results found" */}
          <CommandGroup className="max-h-[300px] overflow-auto">
            {filteredOptions.map((option, index) => (
              <CommandItem
                key={`${option.value}-${index}`}
                value={option.value}
                onSelect={(currentValue) => {
                  onChange(currentValue)
                  setOpen(false)
                  setSearchQuery("")
                }}
                className="flex items-center text-xs"
                aria-selected={value === option.value}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 