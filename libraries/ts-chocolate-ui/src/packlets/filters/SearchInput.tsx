/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Props for the SearchInput component
 * @public
 */
export interface ISearchInputProps {
  /**
   * Current search value
   */
  value: string;
  /**
   * Change handler
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Search input with magnifying glass icon and clear button.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search ingredients..."
 * />
 * ```
 *
 * @param props - Search input props
 * @returns Search input element
 * @public
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = ''
}: ISearchInputProps): React.ReactElement {
  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-chocolate-500 dark:focus:ring-chocolate-400 focus:border-transparent"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
