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
import { useLongPress } from '../hooks/useLongPress';

/**
 * Individual Sudoku cell component with input handling and validation display
 * @public
 */
export const SudokuCell: React.FC<ISudokuCellProps> = ({
  cellInfo,
  isSelected,
  inputMode,
  onSelect,
  onLongPressToggle,
  onValueChange,
  onNoteToggle,
  onClearAllNotes,
  className
}) => {
  const { id, row, column, contents, isImmutable, hasValidationError } = cellInfo;

  // Double-tap detection for clearing all notes
  const lastClickTimeRef = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  // Track if a long press just occurred to prevent click interference
  const longPressOccurredRef = useRef<boolean>(false);

  // Handle keyboard input with notes-first paradigm
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isImmutable) return;

      const key = event.key;

      if (key >= '1' && key <= '9') {
        const value = parseInt(key, 10);

        // Check if modifier keys are pressed to override current input mode
        const hasModifierKey = event.shiftKey || event.ctrlKey || event.metaKey;

        if (hasModifierKey) {
          // Modifier key held - always place value (override current mode)
          onValueChange(value);
        } else if (inputMode === 'value') {
          // Value mode - place value
          onValueChange(value);
        } else {
          // Notes mode (default) - toggle note
          onNoteToggle(value);
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

  // Handle long press for multiselect toggle
  const handleLongPress = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (onLongPressToggle && !isImmutable) {
        console.log(`Long press detected on cell ${id}, setting flag to true`);
        longPressOccurredRef.current = true;
        onLongPressToggle(event);
      }
    },
    [onLongPressToggle, isImmutable, id]
  );

  // Set up long press detection
  const longPressProps = useLongPress({
    onLongPress: handleLongPress,
    delay: 500,
    shouldPreventDefault: false
  });

  // Handle mouse click with double-tap detection
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      // If a long press just occurred, ignore this click event
      if (longPressOccurredRef.current) {
        console.log(`Click on cell ${id} - IGNORING due to long press flag`);
        longPressOccurredRef.current = false; // Reset for next interaction
        event.preventDefault();
        return;
      }

      console.log(`Click on cell ${id} - processing normally`);

      // Prevent default context menu on Ctrl+click
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }

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
    [onSelect, onClearAllNotes, isImmutable, contents.notes.length, id]
  );

  // Handle mouse up - need to check if long press just occurred
  const handleMouseUp = useCallback(
    (event: React.MouseEvent) => {
      const wasLongPress = longPressProps.onMouseUp(event);
      console.log(
        `Mouse up on cell ${id}, wasLongPress: ${wasLongPress}, flag: ${longPressOccurredRef.current}`
      );

      // Don't reset the flag here - let the click handler handle it
      // The flag will be reset in handleClick or handleMouseLeave
    },
    [longPressProps, id]
  );

  // Handle touch end - need to check if long press just occurred
  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const wasLongPress = longPressProps.onTouchEnd(event);

      // Don't reset the flag here - let the click handler handle it
      // The flag will be reset in handleClick or handleMouseLeave
    },
    [longPressProps]
  );

  // Handle mouse leave - reset long press flag
  const handleMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      longPressOccurredRef.current = false;
      longPressProps.onMouseLeave(event);
    },
    [longPressProps]
  );

  // Calculate CSS classes
  const cellClasses = useMemo(() => {
    const classes = [
      // Base cell styles - fill grid cell completely
      'w-full',
      'h-full',
      'border',
      'border-gray-400',
      'bg-white',
      'text-base',
      'md:text-lg',
      'lg:text-xl',
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
      'duration-150',
      'overflow-hidden',
      'p-0'
    ];

    // Hover effects - apply before selection so selection can override
    if (!isImmutable && !isSelected) {
      classes.push('hover:bg-gray-50', 'hover:border-blue-500');
    }
    if (hasValidationError && !isSelected) {
      classes.push('hover:bg-red-50', 'hover:border-red-600');
    }

    // State-based styles - Applied after hover so they take precedence
    if (isSelected) {
      if (className?.includes('multi-selected')) {
        // Multi-Selected: More distinct blue background with darker border
        classes.push('bg-blue-200', 'border-blue-500', '!bg-blue-200');
      } else {
        // Single Selected: Darker blue background for clear distinction
        classes.push('bg-blue-300', 'border-blue-600', '!bg-blue-300');
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

    // Enhanced 3x3 section boundaries per UX specs - using standard Tailwind classes
    if ((column + 1) % 3 === 0 && column < 8) {
      classes.push('border-r-4', 'border-r-black');
    }
    if ((row + 1) % 3 === 0 && row < 8) {
      classes.push('border-b-4', 'border-b-black');
    }

    // Focus styles
    classes.push('focus-visible:ring-2', 'focus-visible:ring-blue-500', 'focus-visible:ring-offset-1');

    if (className) classes.push(className);

    return classes.join(' ');
  }, [isSelected, hasValidationError, isImmutable, contents.value, row, column, className]);

  // Format display value
  const displayValue = contents.value?.toString() || '';

  // Render notes in fixed 3x3 grid layout - each number has fixed position
  const renderNotesGrid = useCallback(() => {
    if (contents.value) return null; // Only show notes when no value is present

    // Create a 3x3 grid for notes (positions 1-9) with fixed layout
    // Only render notes that are actually selected (completely invisible otherwise)
    const notesGrid = Array(9)
      .fill(null)
      .map((__value, index) => {
        const noteValue = index + 1;
        const hasNote = contents.notes.includes(noteValue);

        return (
          <div key={noteValue} className="flex items-center justify-center">
            {hasNote && (
              <span className="text-[0.5rem] md:text-[0.55rem] lg:text-[0.6rem] font-normal leading-none text-gray-600">
                {noteValue}
              </span>
            )}
          </div>
        );
      });

    return (
      <div
        className="absolute inset-0 m-[2px] grid grid-cols-3 grid-rows-3 gap-0 pointer-events-none"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}
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
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      onMouseDown={longPressProps.onMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={longPressProps.onTouchStart}
      onTouchEnd={handleTouchEnd}
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
