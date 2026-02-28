/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Multi-action button component with dropdown for alternative actions.
 * @packageDocumentation
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

// ============================================================================
// Types
// ============================================================================

/**
 * Action definition for multi-action button.
 * @public
 */
export interface IMultiActionButtonAction {
  /** Unique identifier for the action. */
  readonly id: string;
  /** Display label for the action. */
  readonly label: string;
  /** Optional icon element to display before the label. */
  readonly icon?: React.ReactNode;
  /** Callback when this action is selected. */
  readonly onSelect: () => void;
}

/**
 * Props for MultiActionButton component.
 * @public
 */
export interface IMultiActionButtonProps {
  /** Primary action that appears on the main button. */
  readonly primaryAction: IMultiActionButtonAction;
  /** Alternative actions shown in the dropdown menu. */
  readonly alternativeActions: readonly IMultiActionButtonAction[];
  /** Optional variant for button styling. */
  readonly variant?: 'primary' | 'default' | 'danger';
  /** If true, the button is disabled. */
  readonly disabled?: boolean;
  /** Optional CSS class name. */
  readonly className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Multi-action button with dropdown for alternative actions.
 * Similar to Git commit button with "Commit", "Commit & Push", etc.
 *
 * @public
 */
export function MultiActionButton(props: IMultiActionButtonProps): React.ReactElement {
  const { primaryAction, alternativeActions, variant = 'primary', disabled = false, className = '' } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const variantClasses: Record<string, string> = {
    primary: 'bg-choco-primary hover:bg-choco-primary/90 text-white',
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const baseClasses =
    'inline-flex items-center text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className={`relative inline-flex ${className}`} ref={dropdownRef}>
      {/* Primary action button */}
      <button
        type="button"
        onClick={primaryAction.onSelect}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} px-2.5 py-1 ${
          alternativeActions.length > 0 ? 'rounded-r-none' : 'rounded'
        }`}
      >
        {primaryAction.icon}
        <span>{primaryAction.label}</span>
      </button>

      {/* Dropdown toggle button — only shown when there are alternative actions */}
      {alternativeActions.length > 0 && (
        <button
          type="button"
          onClick={(): void => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${baseClasses} ${variantClasses[variant]} px-1 py-1 rounded-l-none border-l border-white/20`}
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Dropdown menu */}
      {isOpen && alternativeActions.length > 0 && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {alternativeActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={(): void => {
                action.onSelect();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
