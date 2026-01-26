/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Props for the CollapsibleSection component
 * @public
 */
export interface ICollapsibleSectionProps {
  /**
   * Section title displayed in the header
   */
  title: string;
  /**
   * Whether the section is currently expanded
   */
  isOpen: boolean;
  /**
   * Handler called when the section is toggled
   */
  onToggle: () => void;
  /**
   * Content to render when expanded
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Collapsible section with header toggle.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(true);
 *
 * <CollapsibleSection
 *   title="Filters"
 *   isOpen={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
 * >
 *   <FilterContent />
 * </CollapsibleSection>
 * ```
 *
 * @param props - Collapsible section props
 * @returns Collapsible section element
 * @public
 */
export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  className = ''
}: ICollapsibleSectionProps): React.ReactElement {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
      >
        <span>{title}</span>
        {isOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
      </button>

      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}
