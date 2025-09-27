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

import React, { useCallback, useMemo, useRef } from 'react';
import { ISudokuCellProps } from '../types';

/**
 * Individual Sudoku cell component with input handling and validation display
 * @public
 */
export const SudokuCell: React.FC<ISudokuCellProps> = ({
  cellInfo,
  isSelected,
  inputMode,
  onSelect,
  onValueChange,
  onNoteToggle,
  onClearAllNotes,
  className
}) => {
  const { id, row, column, contents, isImmutable, hasValidationError } = cellInfo;

  // Double-tap detection for clearing all notes
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  // Handle keyboard input with notes-first paradigm
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isImmutable) return;

      const key = event.key;

      if (key >= '1' && key <= '9') {
        const value = parseInt(key, 10);

        if (inputMode === 'notes' || (!event.shiftKey && !event.ctrlKey && !event.metaKey)) {
          // Default to notes mode, or explicit notes mode
          onNoteToggle(value);
        } else {
          // Modifier key held - commit value (shift/ctrl/cmd + number)
          onValueChange(value);
        }
        event.preventDefault();
      } else if (key === 'Delete' || key === 'Backspace') {
        if (contents.value) {
          // Clear cell value
          onValueChange(undefined);
        } else if (contents.notes.length > 0) {
          // Clear all notes
          onClearAllNotes();
        }
        event.preventDefault();
      } else if (key === '0') {
        // Clear everything
        if (contents.value) {
          onValueChange(undefined);
        }
        if (contents.notes.length > 0) {
          onClearAllNotes();
        }
        event.preventDefault();
      }
      // Arrow key navigation is handled by the parent component
    },
    [
      isImmutable,
      inputMode,
      onValueChange,
      onNoteToggle,
      onClearAllNotes,
      contents.value,
      contents.notes.length
    ]
  );

  // Handle mouse click with double-tap detection
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      const currentTime = Date.now();
      const timeSinceLastClick = currentTime - lastClickTimeRef.current;

      if (timeSinceLastClick < DOUBLE_TAP_DELAY && !isImmutable && contents.notes.length > 0) {
        // Double-tap detected - clear all notes
        onClearAllNotes();
      } else {
        // Single click - select cell (pass event for multi-select)
        onSelect(event);
      }

      lastClickTimeRef.current = currentTime;
    },
    [onSelect, onClearAllNotes, isImmutable, contents.notes.length]
  );

  // Calculate CSS classes
  const cellClasses = useMemo(() => {
    const classes = [
      // Base cell styles
      'w-10',
      'h-10',
      'lg:w-12',
      'lg:h-12',
      'max-sm:w-9',
      'max-sm:h-9',
      'border',
      'border-gray-400',
      'bg-white',
      'text-lg',
      'lg:text-2xl',
      'max-sm:text-base',
      'font-bold',
      'flex',
      'items-center',
      'justify-center',
      'cursor-pointer',
      'outline-none',
      'relative',
      'select-none',
      'touch-manipulation',
      'transition-all',
      'duration-150'
    ];

    // State-based styles
    if (isSelected) {
      if (className?.includes('multi-selected')) {
        classes.push('bg-green-50', 'ring-1', 'ring-green-500');
      } else {
        classes.push('bg-blue-100', 'ring-2', 'ring-blue-600');
      }
    }
    if (hasValidationError) {
      classes.push('bg-red-50', 'text-red-800', 'border-red-500');
    }
    if (isImmutable) {
      classes.push('bg-gray-100', 'cursor-default', 'text-gray-900');
    }
    if (contents.value) {
      classes.push('font-black');
    }

    // Add border classes for 3x3 sections
    if ((column + 1) % 3 === 0 && column < 8) {
      classes.push('border-r-2', 'border-r-gray-900');
    }
    if ((row + 1) % 3 === 0 && row < 8) {
      classes.push('border-b-2', 'border-b-gray-900');
    }

    // Hover effects
    if (!isImmutable) {
      classes.push('hover:bg-gray-50', 'hover:border-blue-500');
    }
    // Selected state already has bg-blue-100, no need for duplicate hover
    if (hasValidationError) {
      classes.push('hover:bg-red-50', 'hover:border-red-600');
    }

    // Focus styles
    classes.push('focus-visible:ring-2', 'focus-visible:ring-blue-500', 'focus-visible:ring-offset-1');

    if (className) classes.push(className);

    return classes.join(' ');
  }, [isSelected, hasValidationError, isImmutable, contents.value, row, column, className]);

  // Format display value
  const displayValue = contents.value?.toString() || '';

  // Render notes in 3x3 grid layout
  const renderNotesGrid = useCallback(() => {
    if (contents.value || contents.notes.length === 0) return null;

    // Create a 3x3 grid for notes (positions 1-9)
    const notesGrid = Array(9)
      .fill(null)
      .map((__value, index) => {
        const noteValue = index + 1;
        const hasNote = contents.notes.includes(noteValue);

        return (
          <span
            key={noteValue}
            className="text-[7px] max-sm:text-[6px] lg:text-[11px] text-gray-600 font-normal leading-none flex items-center justify-center w-full h-full"
          >
            {hasNote ? noteValue : ''}
          </span>
        );
      });

    return (
      <div
        className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 grid grid-cols-3 grid-rows-3 gap-px pointer-events-none"
        aria-hidden="true"
      >
        {notesGrid}
      </div>
    );
  }, [contents.value, contents.notes]);

  return (
    <button
      type="button"
      className={cellClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isSelected ? 0 : -1}
      data-testid={`sudoku-cell-${id}`}
      data-row={row}
      data-column={column}
      data-selected={isSelected}
      data-error={hasValidationError}
      data-immutable={isImmutable}
      data-filled={!!contents.value}
      aria-label={`Row ${row + 1}, Column ${column + 1}, ${
        contents.value
          ? contents.value.toString()
          : contents.notes.length > 0
          ? `notes: ${contents.notes.join(', ')}`
          : 'empty'
      }`}
      aria-selected={isSelected}
    >
      {contents.value ? <span className="text-inherit font-inherit">{displayValue}</span> : renderNotesGrid()}
    </button>
  );
};
