import * as React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface ICollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

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
