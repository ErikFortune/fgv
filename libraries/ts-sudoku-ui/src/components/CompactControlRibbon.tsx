/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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

import React, { useCallback, useMemo, useState } from 'react';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * Props for the CompactControlRibbon component
 * @public
 */
export interface ICompactControlRibbonProps {
  /** Whether undo is available */
  readonly canUndo: boolean;

  /** Whether redo is available */
  readonly canRedo: boolean;

  /** Whether reset is available */
  readonly canReset: boolean;

  /** Whether the puzzle is valid */
  readonly isValid: boolean;

  /** Whether the puzzle is solved */
  readonly isSolved: boolean;

  /** Validation errors for error count display */
  readonly validationErrors: ReadonlyArray<{
    readonly type: string;
    readonly cellId: string;
    readonly message: string;
  }>;

  /** Callback for undo action */
  readonly onUndo: () => void;

  /** Callback for redo action */
  readonly onRedo: () => void;

  /** Callback for reset action */
  readonly onReset: () => void;

  /** Callback for export action */
  readonly onExport: () => void;

  /** Whether to show combinations button (for killer sudoku) */
  readonly showCombinations?: boolean;

  /** Whether combinations button should be enabled */
  readonly canShowCombinations?: boolean;

  /** Callback for combinations action */
  readonly onCombinations?: () => void;

  /** Additional CSS class name */
  readonly className?: string;
}

/**
 * Compact control ribbon with icon-only badges for actions and status indicator
 * @public
 */
export const CompactControlRibbon: React.FC<ICompactControlRibbonProps> = ({
  canUndo,
  canRedo,
  canReset,
  isValid,
  isSolved,
  validationErrors,
  onUndo,
  onRedo,
  onReset,
  onExport,
  showCombinations,
  canShowCombinations,
  onCombinations,
  className
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const responsiveLayout = useResponsiveLayout();

  // Handle reset with confirmation
  const handleResetClick = useCallback(() => {
    if (showResetConfirm) {
      onReset();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  }, [showResetConfirm, onReset]);

  // Cancel reset confirmation
  const handleCancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Calculate if we should use mobile layout
  const isMobileLayout =
    responsiveLayout.deviceType === 'mobile' &&
    (responsiveLayout.keypadLayoutMode === 'side-by-side' || responsiveLayout.keypadLayoutMode === 'stacked');

  // Calculate container classes
  const containerClasses = useMemo(() => {
    const classes = [
      'flex items-center justify-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm'
    ];

    if (isMobileLayout) {
      classes.push('gap-2 p-1.5');
    }

    if (className) classes.push(className);
    return classes.join(' ');
  }, [isMobileLayout, className]);

  // Calculate button classes
  const getButtonClasses = useCallback(
    (isEnabled: boolean, variant: 'default' | 'danger' | 'success' = 'default') => {
      const classes = [
        'flex items-center justify-center rounded-full transition-all duration-150 font-medium text-sm border-2'
      ];

      // Size based on layout
      if (isMobileLayout) {
        classes.push('w-8 h-8 text-xs');
      } else {
        classes.push('w-10 h-10 text-sm');
      }

      // Variant and state styling
      if (!isEnabled) {
        classes.push('border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed');
      } else {
        switch (variant) {
          case 'danger':
            classes.push(
              'border-red-500 text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 cursor-pointer'
            );
            break;
          case 'success':
            classes.push(
              'border-green-500 text-green-600 bg-green-50 hover:bg-green-100 active:bg-green-200 cursor-pointer'
            );
            break;
          default:
            classes.push(
              'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 cursor-pointer'
            );
            break;
        }
      }

      return classes.join(' ');
    },
    [isMobileLayout]
  );

  // Calculate status indicator classes and content
  const statusIndicator = useMemo(() => {
    const classes = ['flex items-center justify-center rounded-full border-2 font-bold'];

    // Size based on layout
    if (isMobileLayout) {
      classes.push('w-8 h-8 text-xs');
    } else {
      classes.push('w-10 h-10 text-sm');
    }

    let content: string;
    let title: string;

    if (isSolved) {
      classes.push('border-green-500 text-green-700 bg-green-100');
      content = '✓';
      title = 'Puzzle solved!';
    } else if (isValid) {
      classes.push('border-green-500 text-green-700 bg-green-100');
      content = '✓';
      title = 'Puzzle is valid';
    } else {
      classes.push('border-red-500 text-red-700 bg-red-100');
      content = validationErrors.length.toString();
      title = `${validationErrors.length} validation error${validationErrors.length === 1 ? '' : 's'}`;
    }

    return {
      className: classes.join(' '),
      content,
      title
    };
  }, [isSolved, isValid, validationErrors.length, isMobileLayout]);

  return (
    <div
      className={containerClasses}
      data-testid="compact-control-ribbon"
      role="toolbar"
      aria-label="Puzzle controls"
    >
      {/* Status Indicator */}
      <div
        className={statusIndicator.className}
        title={statusIndicator.title}
        aria-label={statusIndicator.title}
        data-testid="status-indicator"
      >
        {statusIndicator.content}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Export Button */}
      <button
        type="button"
        onClick={onExport}
        className={getButtonClasses(true, 'success')}
        title="Export puzzle"
        aria-label="Export puzzle in compatible format"
        data-testid="compact-export-button"
      >
        📤
      </button>

      {/* Combinations Button (for killer sudoku) */}
      {showCombinations && onCombinations && (
        <button
          type="button"
          onClick={onCombinations}
          disabled={!canShowCombinations}
          className={getButtonClasses(canShowCombinations ?? false)}
          title={
            canShowCombinations ? 'Show cage combinations (Ctrl/Cmd+K)' : 'Select cells from a single cage'
          }
          aria-label={canShowCombinations ? 'Show combinations for selected cage' : 'No cage selected'}
          data-testid="compact-combinations-button"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </button>
      )}

      {/* Reset Button */}
      {!showResetConfirm ? (
        <button
          type="button"
          onClick={handleResetClick}
          disabled={!canReset}
          className={getButtonClasses(canReset, 'danger')}
          title="Reset puzzle"
          aria-label="Clear all entries"
          data-testid="compact-reset-button"
        >
          🗑️
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetClick}
            className={getButtonClasses(true, 'danger')}
            title="Confirm reset - this will clear all entries"
            aria-label="Confirm reset"
            data-testid="compact-confirm-reset-button"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={handleCancelReset}
            className={getButtonClasses(true)}
            title="Cancel reset"
            aria-label="Cancel reset"
            data-testid="compact-cancel-reset-button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Undo Button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={getButtonClasses(canUndo)}
        title="Undo last action"
        aria-label="Undo last action"
        data-testid="compact-undo-button"
      >
        ↶
      </button>

      {/* Redo Button */}
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={getButtonClasses(canRedo)}
        title="Redo last undone action"
        aria-label="Redo last undone action"
        data-testid="compact-redo-button"
      >
        ↷
      </button>
    </div>
  );
};
