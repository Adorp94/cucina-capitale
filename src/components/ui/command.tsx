"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Create a simplified Command component that doesn't rely on radix-ui or cmdk
export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
Command.displayName = "Command"

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
    }

    return (
      <div
        className="flex items-center border-b px-3"
        cmdk-input-wrapper=""
      >
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)
CommandInput.displayName = "CommandInput"

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-6 text-center text-sm",
      className
    )}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = "CommandGroup"

interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: (value: string) => void
  value?: string
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, onSelect, value = "", ...props }, ref) => {
    const handleClick = () => {
      if (onSelect && value) {
        onSelect(value)
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
          className
        )}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
CommandItem.displayName = "CommandItem"

export {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} 