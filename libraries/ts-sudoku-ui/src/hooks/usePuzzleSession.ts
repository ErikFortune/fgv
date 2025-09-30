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

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PuzzleSession,
  CellId,
  NavigationDirection,
  NavigationWrap,
  Puzzles,
  IPuzzleDescription
} from '@fgv/ts-sudoku-lib';
import { IValidationError, ICellDisplayInfo, InputMode, ICageDisplayInfo } from '../types';

/**
 * Hook for managing puzzle session state and operations
 * @public
 */
export function usePuzzleSession(initialPuzzleDescription?: IPuzzleDescription): {
  session: PuzzleSession | null;
  selectedCell: CellId | null;
  selectedCells: CellId[];
  inputMode: InputMode;
  setSelectedCell: (cell: CellId | null) => void;
  setSelectedCells: (cells: CellId[]) => void;
  setInputMode: (mode: InputMode) => void;
  cellDisplayInfo: ICellDisplayInfo[];
  cageDisplayInfo: ICageDisplayInfo[];
  validationErrors: IValidationError[];
  isValid: boolean;
  isSolved: boolean;
  canUndo: boolean;
  canRedo: boolean;
  error: string | null;
  updateCellValue: (cellId: CellId, value: number | undefined) => void;
  toggleCellNote: (cellId: CellId, note: number) => void;
  clearCellNotes: (cellId: CellId) => void;
  navigateToCell: (direction: NavigationDirection, wrap?: NavigationWrap) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  exportPuzzle: () => IPuzzleDescription | null;
} {
  const [session, setSession] = useState<PuzzleSession | null>(null);
  const [puzzleDescription, setPuzzleDescription] = useState<IPuzzleDescription | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellId | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellId[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('notes'); // Notes-first paradigm
  const [error, setError] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-renders

  // Initialize or update puzzle session
  useEffect(() => {
    const puzzleDescriptor: IPuzzleDescription = initialPuzzleDescription || {
      id: 'manual-entry',
      description: 'Manual Entry Puzzle',
      type: 'sudoku' as const,
      level: 1,
      rows: 9,
      cols: 9,
      cells: '.'.repeat(81) // Empty 9x9 grid
    };

    const sessionResult = Puzzles.Any.create(puzzleDescriptor).onSuccess((puzzle) =>
      PuzzleSession.create(puzzle)
    );

    if (sessionResult.isSuccess()) {
      setSession(sessionResult.value);
      setPuzzleDescription(puzzleDescriptor);
      setError(null);
    } else {
      setError(`Failed to create puzzle session: ${sessionResult.message}`);
      setSession(null);
      setPuzzleDescription(null);
    }
  }, [initialPuzzleDescription]);

  // Get validation errors
  const validationErrors = useMemo((): IValidationError[] => {
    if (!session) return [];

    const errors: IValidationError[] = [];
    const invalidCells = session.getInvalidCells();

    invalidCells.forEach((cell) => {
      const contentsResult = session.state.getCellContents(cell.id);
      if (contentsResult.isSuccess() && contentsResult.value.value) {
        const contents = contentsResult.value;

        // Check for duplicates in row, column, and section
        const rowCells = session.rows[cell.row];
        const colCells = session.cols[cell.col];
        const sectionCells = session.sections[Math.floor(cell.row / 3) * 3 + Math.floor(cell.col / 3)];

        const checkDuplicates = (cageCellIds: CellId[], type: IValidationError['type']): void => {
          const duplicates = cageCellIds.filter((cellId) => {
            if (cellId === cell.id) return false;
            const cellContentsResult = session.state.getCellContents(cellId);
            return cellContentsResult.isSuccess() && cellContentsResult.value.value === contents.value;
          });

          if (duplicates.length > 0) {
            errors.push({
              cellId: cell.id,
              type,
              conflictingCells: duplicates,
              message: `Duplicate ${contents.value} in ${type.replace('duplicate-', '').replace('-', ' ')}`
            });
          }
        };

        checkDuplicates(rowCells.cellIds, 'duplicate-row');
        checkDuplicates(colCells.cellIds, 'duplicate-column');
        checkDuplicates(sectionCells.cellIds, 'duplicate-section');

        // For Sudoku X puzzles, also check diagonal constraints
        if (puzzleDescription?.type === 'sudoku-x') {
          // Find diagonal cages in the session
          const diagonalCages = session.cages.filter((cage) => cage.cageType === 'x');

          // Check main diagonal (top-left to bottom-right)
          if (cell.row === cell.col && diagonalCages.length > 0) {
            const mainDiagonal = diagonalCages[0];
            checkDuplicates(mainDiagonal.cellIds, 'duplicate-diagonal');
          }

          // Check anti-diagonal (top-right to bottom-left)
          if (cell.row + cell.col === 8 && diagonalCages.length > 1) {
            const antiDiagonal = diagonalCages[1];
            checkDuplicates(antiDiagonal.cellIds, 'duplicate-diagonal');
          }
        }
      }
    });

    return errors;
  }, [session, puzzleDescription, updateCounter]);

  // Get cell display information
  const cellDisplayInfo = useMemo((): ICellDisplayInfo[] => {
    if (!session) return [];

    return session.cells.map((cell) => {
      const contentsResult = session.state.getCellContents(cell.id);
      const contents = contentsResult.isSuccess() ? contentsResult.value : { value: undefined, notes: [] };
      const hasValidationError = validationErrors.some((error) => error.cellId === cell.id);

      return {
        id: cell.id,
        row: cell.row,
        column: cell.col,
        contents,
        isImmutable: cell.immutable,
        hasValidationError
      };
    });
  }, [session, validationErrors, updateCounter]);

  // Get cage display information for Killer Sudoku
  const cageDisplayInfo = useMemo((): ICageDisplayInfo[] => {
    if (!session || puzzleDescription?.type !== 'killer-sudoku') return [];

    return session.cages
      .filter((cage) => cage.cageType === 'killer') // Only show killer cages, not diagonal/section cages
      .map((cage) => {
        // Calculate current sum
        let currentSum = 0;
        let isComplete = true;
        let hasValues = false;

        for (const cellId of cage.cellIds) {
          const contentsResult = session.state.getCellContents(cellId);
          if (contentsResult.isSuccess() && contentsResult.value.value) {
            currentSum += contentsResult.value.value;
            hasValues = true;
          } else {
            isComplete = false;
          }
        }

        // Check if the current sum is valid (not exceeding target when incomplete, or matching target when complete)
        const isValid = isComplete ? currentSum === cage.total : currentSum <= cage.total;

        // Check if cage should be highlighted (contains selected cell)
        const isHighlighted = selectedCell ? cage.cellIds.includes(selectedCell) : false;

        return {
          cage,
          isHighlighted,
          currentSum: hasValues ? currentSum : undefined,
          isComplete,
          isValid
        };
      });
  }, [session, puzzleDescription, selectedCell, updateCounter]);

  // Helper function to remove notes that conflict with a placed value
  const removeConflictingNotes = useCallback(
    (placedCellId: CellId, placedValue: number) => {
      if (!session) return;

      const placedCell = session.cells.find((cell) => cell.id === placedCellId);
      if (!placedCell) return;

      // Get cells in the same row, column, and section
      const rowCells = session.rows[placedCell.row].cellIds;
      const colCells = session.cols[placedCell.col].cellIds;
      const sectionCells =
        session.sections[Math.floor(placedCell.row / 3) * 3 + Math.floor(placedCell.col / 3)].cellIds;

      // Start with row, column, and section cells
      const affectedCells = new Set([...rowCells, ...colCells, ...sectionCells]);

      // For Sudoku X puzzles, also include diagonal cells
      if (puzzleDescription?.type === 'sudoku-x') {
        // Find diagonal cages in the session
        const diagonalCages = session.cages.filter((cage) => cage.cageType === 'x');

        // Check main diagonal (top-left to bottom-right)
        if (placedCell.row === placedCell.col && diagonalCages.length > 0) {
          const mainDiagonal = diagonalCages[0];
          mainDiagonal.cellIds.forEach((cellId) => affectedCells.add(cellId));
        }

        // Check anti-diagonal (top-right to bottom-left)
        if (placedCell.row + placedCell.col === 8 && diagonalCages.length > 1) {
          const antiDiagonal = diagonalCages[1];
          antiDiagonal.cellIds.forEach((cellId) => affectedCells.add(cellId));
        }
      }

      // Remove the placed cell itself from the list
      affectedCells.delete(placedCellId);

      // Update notes for each affected cell
      for (const cellId of Array.from(affectedCells)) {
        const contentsResult = session.state.getCellContents(cellId);
        if (contentsResult.isSuccess()) {
          const contents = contentsResult.value;

          // Only update if the cell has notes and contains the placed value
          if (contents.notes.length > 0 && contents.notes.includes(placedValue) && !contents.value) {
            const newNotes = contents.notes.filter((note) => note !== placedValue);
            session.updateCellNotes(cellId, newNotes);
          }
        }
      }
    },
    [session, puzzleDescription]
  );

  // Update cell value with smart note removal
  const updateCellValue = useCallback(
    (cellId: CellId, value: number | undefined) => {
      if (!session) return;

      const result = session.updateCellValue(cellId, value);
      if (result.isSuccess()) {
        // If a value was placed (not removed), remove conflicting notes
        if (value !== undefined) {
          removeConflictingNotes(cellId, value);
        }

        // Force re-render by incrementing update counter
        setUpdateCounter((prev) => prev + 1);
      } else {
        setError(`Failed to update cell: ${result.message}`);
      }
    },
    [session, removeConflictingNotes]
  );

  // Toggle a note in a cell
  const toggleCellNote = useCallback(
    (cellId: CellId, note: number) => {
      if (!session) return;

      // Get current cell contents
      const contentsResult = session.state.getCellContents(cellId);
      if (contentsResult.isFailure()) {
        setError(`Failed to get cell contents: ${contentsResult.message}`);
        return;
      }

      const currentNotes = contentsResult.value.notes;
      const newNotes = currentNotes.includes(note)
        ? currentNotes.filter((n) => n !== note) // Remove note if it exists
        : [...currentNotes, note].sort(); // Add note if it doesn't exist

      const result = session.updateCellNotes(cellId, newNotes);
      if (result.isSuccess()) {
        setUpdateCounter((prev) => prev + 1);
      } else {
        setError(`Failed to toggle note: ${result.message}`);
      }
    },
    [session]
  );

  // Clear all notes from a cell
  const clearCellNotes = useCallback(
    (cellId: CellId) => {
      if (!session) return;

      const result = session.updateCellNotes(cellId, []);
      if (result.isSuccess()) {
        setUpdateCounter((prev) => prev + 1);
      } else {
        setError(`Failed to clear notes: ${result.message}`);
      }
    },
    [session]
  );

  // Navigate to adjacent cell
  const navigateToCell = useCallback(
    (direction: NavigationDirection, wrap: NavigationWrap = 'wrap-around') => {
      if (!session || !selectedCell) return;

      const currentCell = session.cells.find((cell) => cell.id === selectedCell);
      if (!currentCell) return;

      let newRow = currentCell.row;
      let newCol = currentCell.col;

      switch (direction) {
        case 'up':
          newRow = newRow > 0 ? newRow - 1 : wrap === 'wrap-around' ? session.numRows - 1 : newRow;
          break;
        case 'down':
          newRow = newRow < session.numRows - 1 ? newRow + 1 : wrap === 'wrap-around' ? 0 : newRow;
          break;
        case 'left':
          newCol = newCol > 0 ? newCol - 1 : wrap === 'wrap-around' ? session.numColumns - 1 : newCol;
          break;
        case 'right':
          newCol = newCol < session.numColumns - 1 ? newCol + 1 : wrap === 'wrap-around' ? 0 : newCol;
          break;
      }

      const targetCell = session.cells.find((cell) => cell.row === newRow && cell.col === newCol);
      if (targetCell) {
        setSelectedCell(targetCell.id);
      }
    },
    [session, selectedCell]
  );

  // Undo last move
  const undo = useCallback(() => {
    if (!session) return;

    const result = session.undo();
    if (result.isSuccess()) {
      setUpdateCounter((prev) => prev + 1);
    } else {
      setError(`Failed to undo: ${result.message}`);
    }
  }, [session]);

  // Redo last undone move
  const redo = useCallback(() => {
    if (!session) return;

    const result = session.redo();
    if (result.isSuccess()) {
      setUpdateCounter((prev) => prev + 1);
    } else {
      setError(`Failed to redo: ${result.message}`);
    }
  }, [session]);

  // Reset puzzle to initial state
  const reset = useCallback(() => {
    if (!session) return;

    const result = PuzzleSession.create(session.puzzle);
    if (result.isSuccess()) {
      setSession(result.value);
      setSelectedCell(null);
      setUpdateCounter(0);
    } else {
      setError(`Failed to reset: ${result.message}`);
    }
  }, [session]);

  // Export puzzle state
  const exportPuzzle = useCallback((): IPuzzleDescription | null => {
    if (!session) return null;

    const cellsArray = Array(session.numRows * session.numColumns).fill('.');

    session.cells.forEach((cell) => {
      const contentsResult = session.state.getCellContents(cell.id);
      const index = cell.row * session.numColumns + cell.col;
      if (contentsResult.isSuccess() && contentsResult.value.value) {
        cellsArray[index] = contentsResult.value.value.toString();
      }
    });

    return {
      id: session.id || 'exported-puzzle',
      description: session.description || 'Exported Puzzle',
      type: puzzleDescription?.type || 'sudoku',
      level: 1,
      rows: session.numRows,
      cols: session.numColumns,
      cells: cellsArray.join('')
    };
  }, [session, puzzleDescription, updateCounter]);

  return {
    session,
    selectedCell,
    selectedCells,
    inputMode,
    setSelectedCell,
    setSelectedCells,
    setInputMode,
    cellDisplayInfo,
    cageDisplayInfo,
    validationErrors,
    isValid: session?.checkIsValid() ?? false,
    isSolved: session?.checkIsSolved() ?? false,
    canUndo: session?.canUndo ?? false,
    canRedo: session?.canRedo ?? false,
    error,
    updateCellValue,
    toggleCellNote,
    clearCellNotes,
    navigateToCell,
    undo,
    redo,
    reset,
    exportPuzzle
  };
}
