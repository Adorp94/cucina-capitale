"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Pagination = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    role="navigation"
    aria-label="pagination"
    ref={ref}
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
))
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps =
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isActive?: boolean
  }

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
        isActive && "bg-accent",
        className
      )}
      {...props}
    />
  )
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    aria-label="Go to previous page"
    className={cn("hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors", className)}
    {...props}
  >
    <ChevronLeftIcon className="size-4" />
    <span className="sr-only">Previous</span>
  </a>
))
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    aria-label="Go to next page"
    className={cn("hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors", className)}
    {...props}
  >
    <ChevronRightIcon className="size-4" />
    <span className="sr-only">Next</span>
  </a>
))
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("flex size-9 items-center justify-center", className)}
  >
    <MoreHorizontalIcon className="size-4" />
    <span className="sr-only">More pages</span>
  </div>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} 