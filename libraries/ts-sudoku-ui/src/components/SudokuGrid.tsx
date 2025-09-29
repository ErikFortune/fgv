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
import { CellId, NavigationDirection } from '@fgv/ts-sudoku-lib';
import { ISudokuGridProps } from '../types';
import { SudokuCell } from './SudokuCell';
import { CageOverlay } from './CageOverlay';

/**
 * Grid component that renders the 9x9 Sudoku grid with proper visual structure
 * @public
 */
export const SudokuGrid: React.FC<ISudokuGridProps> = ({
  numRows,
  numColumns,
  cells,
  cages,
  selectedCell,
  selectedCells,
  inputMode,
  puzzleType,
  onCellSelect,
  onLongPressToggle,
  onCellValueChange,
  onNoteToggle,
  onClearAllNotes,
  onNavigate,
  onDragOver,
  onDragEnd,
  isDragging,
  className
}) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!selectedCell) return;

      const { key } = event;
      let direction: NavigationDirection | null = null;

      switch (key) {
        case 'ArrowUp':
          direction = 'up';
          break;
        case 'ArrowDown':
          direction = 'down';
          break;
        case 'ArrowLeft':
          direction = 'left';
          break;
        case 'ArrowRight':
          direction = 'right';
          break;
        default:
          return; // Let the cell handle number/delete keys
      }

      if (direction) {
        onNavigate(direction);
        event.preventDefault();
      }
    },
    [selectedCell, onNavigate]
  );

  // Create cell select handler
  const createCellSelectHandler = useCallback(
    (cellId: CellId) => {
      return (event?: React.MouseEvent) => onCellSelect(cellId, event);
    },
    [onCellSelect]
  );

  // Create cell value change handler
  const createCellValueChangeHandler = useCallback(
    (cellId: CellId) => {
      return (value: number | undefined) => onCellValueChange(cellId, value);
    },
    [onCellValueChange]
  );

  // Create note toggle handler
  const createNoteToggleHandler = useCallback(
    (cellId: CellId) => {
      return (note: number) => onNoteToggle(cellId, note);
    },
    [onNoteToggle]
  );

  // Create clear all notes handler
  const createClearAllNotesHandler = useCallback(
    (cellId: CellId) => {
      return () => onClearAllNotes(cellId);
    },
    [onClearAllNotes]
  );

  // Create long press toggle handler
  const createLongPressToggleHandler = useCallback(
    (cellId: CellId) => {
      return onLongPressToggle
        ? (event: React.TouchEvent | React.MouseEvent) => onLongPressToggle(cellId, event)
        : undefined;
    },
    [onLongPressToggle]
  );

  // Create drag over handler
  const createDragOverHandler = useCallback(
    (cellId: CellId) => {
      return onDragOver ? () => onDragOver(cellId) : undefined;
    },
    [onDragOver]
  );

  // Calculate grid classes
  const gridClasses = useMemo(() => {
    const classes = ['sudoku-grid'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);

  // Calculate border classes based on puzzle type
  const borderClasses = useMemo(() => {
    //if (puzzleType === 'killer') {
    // Minimal borders for Killer Sudoku to let cage borders stand out
    //return 'gap-px border  border-2 border-gray-300 bg-gray-300';
    //}
    // Standard thick borders for other puzzle types
    return 'border-2 border-black bg-black';
  }, [puzzleType]);

  // Sort cells by row and column for proper display order
  const sortedCells = useMemo(() => {
    return [...cells].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.column - b.column;
    });
  }, [cells]);

  // Calculate grid dimensions for overlays
  const gridDimensions = useMemo(() => {
    // Base cell size in grid units - we'll scale this with CSS
    const baseCellSize = 1;
    return {
      cellSize: baseCellSize,
      gridSize: {
        width: numColumns * baseCellSize,
        height: numRows * baseCellSize
      }
    };
  }, [numRows, numColumns]);

  // Render diagonal lines for Sudoku X puzzles
  const renderDiagonalLines = (): React.ReactNode => {
    if (puzzleType !== 'sudoku-x') return null;

    return (
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: `
            linear-gradient(45deg, transparent 49%, rgba(156, 163, 175, 0.15) 49.5%, rgba(156, 163, 175, 0.15) 50.5%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, rgba(156, 163, 175, 0.15) 49.5%, rgba(156, 163, 175, 0.15) 50.5%, transparent 51%)
          `,
          zIndex: 1
        }}
      />
    );
  };

  // Render cage overlay for Killer Sudoku
  const renderCageOverlay = (): React.ReactNode => {
    if (puzzleType !== 'killer-sudoku' || !cages || cages.length === 0) return null;

    return (
      <CageOverlay cages={cages} gridSize={gridDimensions.gridSize} cellSize={gridDimensions.cellSize} />
    );
  };

  return (
    <div
      className={`
        ${gridClasses}
        relative
        grid grid-cols-9 grid-rows-9 ${puzzleType === 'killer-sudoku' ? 'gap-0' : 'gap-0'}
        ${borderClasses}
        mx-auto outline-none
        aspect-square
        w-[450px]
        md:w-[540px]
        lg:w-[630px]
        max-w-full
      `}
      onKeyDown={handleKeyDown}
      onMouseUp={onDragEnd}
      onTouchEnd={onDragEnd}
      role="grid"
      aria-label="Sudoku puzzle entry grid"
      tabIndex={0}
      data-testid="sudoku-grid"
    >
      {renderDiagonalLines()}
      {renderCageOverlay()}
      {sortedCells.map((cellInfo) => {
        const isPrimarySelected = selectedCell === cellInfo.id;
        const isInMultiSelection = selectedCells.includes(cellInfo.id);

        return (
          <SudokuCell
            key={cellInfo.id}
            cellInfo={cellInfo}
            isSelected={isPrimarySelected || isInMultiSelection}
            inputMode={inputMode}
            onSelect={createCellSelectHandler(cellInfo.id)}
            onLongPressToggle={createLongPressToggleHandler(cellInfo.id)}
            onValueChange={createCellValueChangeHandler(cellInfo.id)}
            onNoteToggle={createNoteToggleHandler(cellInfo.id)}
            onClearAllNotes={createClearAllNotesHandler(cellInfo.id)}
            onDragOver={createDragOverHandler(cellInfo.id)}
            className={isInMultiSelection && !isPrimarySelected ? 'sudoku-cell--multi-selected' : undefined}
          />
        );
      })}
    </div>
  );
};
