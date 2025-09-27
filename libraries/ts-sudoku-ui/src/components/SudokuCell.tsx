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

import React, { useCallback, useMemo } from 'react';
import { ISudokuCellProps } from '../types';

/**
 * Individual Sudoku cell component with input handling and validation display
 * @public
 */
export const SudokuCell: React.FC<ISudokuCellProps> = ({
  cellInfo,
  isSelected,
  onSelect,
  onValueChange,
  className
}) => {
  const { id, row, column, contents, isImmutable, hasValidationError } = cellInfo;

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isImmutable) return;

      const key = event.key;

      if (key >= '1' && key <= '9') {
        const value = parseInt(key, 10);
        onValueChange(value);
        event.preventDefault();
      } else if (key === 'Delete' || key === 'Backspace' || key === '0') {
        onValueChange(undefined);
        event.preventDefault();
      }
      // Arrow key navigation is handled by the parent component
    },
    [isImmutable, onValueChange]
  );

  // Handle mouse click
  const handleClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  // Calculate CSS classes
  const cellClasses = useMemo(() => {
    const classes = ['sudoku-cell'];

    if (isSelected) classes.push('sudoku-cell--selected');
    if (hasValidationError) classes.push('sudoku-cell--error');
    if (isImmutable) classes.push('sudoku-cell--immutable');
    if (contents.value) classes.push('sudoku-cell--filled');

    // Add border classes for 3x3 sections
    if ((column + 1) % 3 === 0 && column < 8) classes.push('sudoku-cell--right-section-border');
    if ((row + 1) % 3 === 0 && row < 8) classes.push('sudoku-cell--bottom-section-border');

    if (className) classes.push(className);

    return classes.join(' ');
  }, [isSelected, hasValidationError, isImmutable, contents.value, row, column, className]);

  // Format display value
  const displayValue = contents.value?.toString() || '';

  // Format notes display (for future enhancement)
  const notesDisplay = contents.notes.length > 0 ? contents.notes.join(' ') : '';

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
      aria-label={`Row ${row + 1}, Column ${column + 1}, ${contents.value || 'empty'}`}
      aria-selected={isSelected}
      style={{
        // Basic inline styles - in a real app these would be in CSS
        width: '40px',
        height: '40px',
        border: '1px solid #ddd',
        borderRight: (column + 1) % 3 === 0 && column < 8 ? '2px solid #333' : '1px solid #ddd',
        borderBottom: (row + 1) % 3 === 0 && row < 8 ? '2px solid #333' : '1px solid #ddd',
        backgroundColor: hasValidationError
          ? '#ffebee'
          : isSelected
          ? '#e3f2fd'
          : isImmutable
          ? '#f5f5f5'
          : '#fff',
        fontSize: '18px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isImmutable ? 'default' : 'pointer',
        outline: isSelected ? '2px solid #1976d2' : 'none',
        position: 'relative'
      }}
    >
      <span className="sudoku-cell__value">{displayValue}</span>
      {notesDisplay && (
        <span
          className="sudoku-cell__notes"
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '8px',
            color: '#666'
          }}
        >
          {notesDisplay}
        </span>
      )}
    </button>
  );
};
