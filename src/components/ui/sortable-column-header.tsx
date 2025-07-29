'use client';

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortableColumnHeaderProps {
  children: React.ReactNode;
  column: string;
  currentSort?: { column: string; direction: SortDirection };
  onSort: (column: string, direction: SortDirection) => void;
  className?: string;
}

export function SortableColumnHeader({ 
  children, 
  column, 
  currentSort, 
  onSort, 
  className 
}: SortableColumnHeaderProps) {
  const isActive = currentSort?.column === column;
  const currentDirection = isActive ? currentSort.direction : 'none';

  const handleClick = () => {
    let nextDirection: SortDirection;
    
    if (currentDirection === 'none') {
      nextDirection = 'asc';  // First click: A-Z
    } else if (currentDirection === 'asc') {
      nextDirection = 'desc'; // Second click: Z-A
    } else {
      nextDirection = 'none'; // Third click: back to normal (no sort)
    }
    
    onSort(column, nextDirection);
  };

  const getSortIcon = () => {
    if (currentDirection === 'asc') {
      return <ChevronUp className="h-4 w-4" />;
    } else if (currentDirection === 'desc') {
      return <ChevronDown className="h-4 w-4" />;
    } else {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(
        "h-auto p-0 font-medium text-gray-900 hover:bg-transparent hover:text-gray-700 justify-start",
        isActive && "text-gray-900",
        className
      )}
    >
      <span className="flex items-center gap-2">
        {children}
        {getSortIcon()}
      </span>
    </Button>
  );
}

// Removed client-side sorting hook - using server-side sorting instead