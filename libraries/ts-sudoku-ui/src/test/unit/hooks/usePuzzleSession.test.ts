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

import { renderHook, act } from '@testing-library/react';
import { IPuzzleDescription, CellId } from '@fgv/ts-sudoku-lib';
import '@fgv/ts-utils-jest';
import { usePuzzleSession } from '../../../hooks/usePuzzleSession';

describe('usePuzzleSession', () => {
  const validPuzzleDescription: IPuzzleDescription = {
    id: 'test-puzzle',
    description: 'Test Puzzle',
    type: 'sudoku',
    level: 1,
    rows: 9,
    cols: 9,
    cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
  };

  const simplePuzzleDescription: IPuzzleDescription = {
    id: 'simple-puzzle',
    description: 'Simple Test Puzzle',
    type: 'sudoku',
    level: 1,
    rows: 9,
    cols: 9,
    cells: '1........................................................................'
  };

  describe('initialization', () => {
    test('should initialize with default empty puzzle when no initial puzzle provided', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.session).not.toBeNull();
      expect(result.current.selectedCell).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.cellDisplayInfo).toHaveLength(81);
      expect(result.current.validationErrors).toHaveLength(0);
      expect(result.current.isValid).toBe(true);
      expect(result.current.isSolved).toBe(false);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    test('should initialize with provided puzzle description', () => {
      const { result } = renderHook(() => usePuzzleSession(validPuzzleDescription));

      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.id).toBe('test-puzzle');
      expect(result.current.session?.description).toBe('Test Puzzle');
      expect(result.current.error).toBeNull();
      expect(result.current.cellDisplayInfo).toHaveLength(81);
    });

    test('should handle invalid puzzle description by setting error', () => {
      const invalidPuzzle: IPuzzleDescription = {
        id: 'invalid',
        description: 'Invalid',
        type: 'sudoku',
        level: 1,
        rows: 9,
        cols: 9,
        cells: 'invalid-length' // Too short
      };

      const { result } = renderHook(() => usePuzzleSession(invalidPuzzle));

      expect(result.current.session).toBeNull();
      expect(result.current.error).toContain('Failed to create puzzle session');
    });

    test('should update when initial puzzle description changes', () => {
      const { result, rerender } = renderHook(({ puzzle }) => usePuzzleSession(puzzle), {
        initialProps: { puzzle: simplePuzzleDescription }
      });

      expect(result.current.session?.id).toBe('simple-puzzle');

      rerender({ puzzle: validPuzzleDescription });

      expect(result.current.session?.id).toBe('test-puzzle');
    });
  });

  describe('cell display information', () => {
    test('should provide correct cell display information for empty puzzle', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cells = result.current.cellDisplayInfo;
      expect(cells).toHaveLength(81);

      const firstCell = cells[0];
      expect(firstCell.id).toBeDefined();
      expect(firstCell.row).toBe(0);
      expect(firstCell.column).toBe(0);
      expect(firstCell.contents.value).toBeUndefined();
      expect(firstCell.contents.notes).toEqual([]);
      expect(firstCell.isImmutable).toBe(false);
      expect(firstCell.hasValidationError).toBe(false);

      const lastCell = cells[80];
      expect(lastCell.row).toBe(8);
      expect(lastCell.column).toBe(8);
    });

    test('should show immutable cells for pre-filled puzzle', () => {
      const { result } = renderHook(() => usePuzzleSession(simplePuzzleDescription));

      const cells = result.current.cellDisplayInfo;
      const firstCell = cells[0];
      expect(firstCell.contents.value).toBe(1);
      expect(firstCell.isImmutable).toBe(true);

      const secondCell = cells[1];
      expect(secondCell.contents.value).toBeUndefined();
      expect(secondCell.isImmutable).toBe(false);
    });

    test('should update cell display information when cells change', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const initialCells = result.current.cellDisplayInfo;
      const firstCell = initialCells[0];
      expect(firstCell.contents.value).toBeUndefined();

      act(() => {
        result.current.updateCellValue(firstCell.id, 5);
      });

      const updatedCells = result.current.cellDisplayInfo;
      const updatedFirstCell = updatedCells[0];
      expect(updatedFirstCell.contents.value).toBe(5);
    });
  });

  describe('cell value updates', () => {
    test('should update cell value successfully', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      act(() => {
        result.current.updateCellValue(cellId, 5);
      });

      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.value).toBe(5);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('should clear cell value when undefined is provided', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      act(() => {
        result.current.updateCellValue(cellId, 5);
      });

      act(() => {
        result.current.updateCellValue(cellId, undefined);
      });

      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.value).toBeUndefined();
    });

    test('should handle invalid cell updates gracefully', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Try to update with invalid cell ID
      act(() => {
        result.current.updateCellValue('invalid-cell-id' as unknown as CellId, 5);
      });

      expect(result.current.error).toContain('Failed to update cell');
    });

    test('should not allow updates to immutable cells', () => {
      const { result } = renderHook(() => usePuzzleSession(simplePuzzleDescription));

      const immutableCell = result.current.cellDisplayInfo.find((cell) => cell.isImmutable);
      expect(immutableCell).toBeDefined();

      act(() => {
        result.current.updateCellValue(immutableCell!.id, 9);
      });

      // Cell should remain unchanged
      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === immutableCell!.id);
      expect(updatedCell?.contents.value).toBe(1); // Original value
    });
  });

  describe('cell selection and navigation', () => {
    test('should select and deselect cells', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      act(() => {
        result.current.setSelectedCell(cellId);
      });

      expect(result.current.selectedCell).toBe(cellId);

      act(() => {
        result.current.setSelectedCell(null);
      });

      expect(result.current.selectedCell).toBeNull();
    });

    test('should navigate up correctly', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Select cell in second row (row 1)
      const cellInSecondRow = result.current.cellDisplayInfo.find(
        (cell) => cell.row === 1 && cell.column === 0
      );
      expect(cellInSecondRow).toBeDefined();

      act(() => {
        result.current.setSelectedCell(cellInSecondRow!.id);
      });

      act(() => {
        result.current.navigateToCell('up');
      });

      // Should move to first row (row 0)
      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should navigate down correctly', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Select cell in first row
      const cellInFirstRow = result.current.cellDisplayInfo.find(
        (cell) => cell.row === 0 && cell.column === 0
      );
      expect(cellInFirstRow).toBeDefined();

      act(() => {
        result.current.setSelectedCell(cellInFirstRow!.id);
      });

      act(() => {
        result.current.navigateToCell('down');
      });

      // Should move to second row
      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 1 && cell.column === 0);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should navigate left correctly', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Select cell in second column
      const cellInSecondColumn = result.current.cellDisplayInfo.find(
        (cell) => cell.row === 0 && cell.column === 1
      );
      expect(cellInSecondColumn).toBeDefined();

      act(() => {
        result.current.setSelectedCell(cellInSecondColumn!.id);
      });

      act(() => {
        result.current.navigateToCell('left');
      });

      // Should move to first column
      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should navigate right correctly', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Select cell in first column
      const cellInFirstColumn = result.current.cellDisplayInfo.find(
        (cell) => cell.row === 0 && cell.column === 0
      );
      expect(cellInFirstColumn).toBeDefined();

      act(() => {
        result.current.setSelectedCell(cellInFirstColumn!.id);
      });

      act(() => {
        result.current.navigateToCell('right');
      });

      // Should move to second column
      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 1);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should wrap around when navigating at edges', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Select cell at top edge
      const topEdgeCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(topEdgeCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(topEdgeCell!.id);
      });

      act(() => {
        result.current.navigateToCell('up'); // Should wrap to bottom
      });

      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 8 && cell.column === 0);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should not navigate when no cell is selected', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.selectedCell).toBeNull();

      act(() => {
        result.current.navigateToCell('right');
      });

      expect(result.current.selectedCell).toBeNull();
    });
  });

  describe('undo and redo functionality', () => {
    test('should undo cell value changes', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      // Make a change
      act(() => {
        result.current.updateCellValue(cellId, 5);
      });

      expect(result.current.canUndo).toBe(true);

      const cellWithValue = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(cellWithValue?.contents.value).toBe(5);

      // Undo the change
      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      const cellAfterUndo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(cellAfterUndo?.contents.value).toBeUndefined();
    });

    test('should redo undone changes', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      // Make a change
      act(() => {
        result.current.updateCellValue(cellId, 7);
      });

      // Undo the change
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Redo the change
      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);

      const cellAfterRedo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(cellAfterRedo?.contents.value).toBe(7);
    });

    test('should handle undo when there is nothing to undo', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.error).toContain('Failed to undo');
    });

    test('should handle redo when there is nothing to redo', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.redo();
      });

      expect(result.current.error).toContain('Failed to redo');
    });
  });

  describe('reset functionality', () => {
    test('should reset puzzle to initial state', () => {
      const { result } = renderHook(() => usePuzzleSession(simplePuzzleDescription));

      const mutableCellId = result.current.cellDisplayInfo.find((cell) => !cell.isImmutable)?.id;
      expect(mutableCellId).toBeDefined();

      // Make some changes
      act(() => {
        result.current.updateCellValue(mutableCellId!, 9);
      });

      const cellId = result.current.cellDisplayInfo[5].id;
      act(() => {
        result.current.setSelectedCell(cellId);
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.selectedCell).toBe(cellId);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.selectedCell).toBeNull();

      const resetCell = result.current.cellDisplayInfo.find((cell) => cell.id === mutableCellId);
      expect(resetCell?.contents.value).toBeUndefined();
    });

    test('should handle reset failure gracefully', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Temporarily break the session to simulate reset failure
      (result.current as unknown as Record<string, unknown>).session = null;

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toContain('Failed to reset');
    });
  });

  describe('export functionality', () => {
    test('should export empty puzzle correctly', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const exported = result.current.exportPuzzle();

      expect(exported).not.toBeNull();
      expect(exported?.id).toBe('manual-entry');
      expect(exported?.description).toBe('Manual Entry Puzzle');
      expect(exported?.type).toBe('sudoku');
      expect(exported?.rows).toBe(9);
      expect(exported?.cols).toBe(9);
      expect(exported?.cells).toBe('.'.repeat(81));
    });

    test('should export puzzle with values correctly', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const firstCellId = result.current.cellDisplayInfo[0].id;
      const secondCellId = result.current.cellDisplayInfo[1].id;

      act(() => {
        result.current.updateCellValue(firstCellId, 1);
        result.current.updateCellValue(secondCellId, 2);
      });

      const exported = result.current.exportPuzzle();

      expect(exported).not.toBeNull();
      expect(exported?.cells[0]).toBe('1');
      expect(exported?.cells[1]).toBe('2');
      expect(exported?.cells.substring(2)).toBe('.'.repeat(79));
    });

    test('should return null when no session exists', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Temporarily remove session
      (result.current as unknown as Record<string, unknown>).session = null;

      const exported = result.current.exportPuzzle();

      expect(exported).toBeNull();
    });

    test('should export custom puzzle description correctly', () => {
      const { result } = renderHook(() => usePuzzleSession(validPuzzleDescription));

      const exported = result.current.exportPuzzle();

      expect(exported).not.toBeNull();
      expect(exported?.id).toBe('test-puzzle');
      expect(exported?.description).toBe('Test Puzzle');
    });
  });

  describe('validation', () => {
    test('should detect validation errors for duplicate values', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Place duplicate values in the same row
      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const firstCell = firstRowCells[0];
      const secondCell = firstRowCells[1];

      act(() => {
        result.current.updateCellValue(firstCell.id, 5);
        result.current.updateCellValue(secondCell.id, 5);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(0);

      const rowError = result.current.validationErrors.find((error) => error.type === 'duplicate-row');
      expect(rowError).toBeDefined();
      expect(rowError?.message).toContain('Duplicate 5 in row');
    });

    test('should show cells have validation errors when duplicates exist', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const firstCell = firstRowCells[0];
      const secondCell = firstRowCells[1];

      act(() => {
        result.current.updateCellValue(firstCell.id, 7);
        result.current.updateCellValue(secondCell.id, 7);
      });

      const updatedFirstCell = result.current.cellDisplayInfo.find((cell) => cell.id === firstCell.id);
      const updatedSecondCell = result.current.cellDisplayInfo.find((cell) => cell.id === secondCell.id);

      expect(updatedFirstCell?.hasValidationError).toBe(true);
      expect(updatedSecondCell?.hasValidationError).toBe(true);
    });

    test('should clear validation errors when duplicates are resolved', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const firstCell = firstRowCells[0];
      const secondCell = firstRowCells[1];

      // Create duplicate
      act(() => {
        result.current.updateCellValue(firstCell.id, 3);
        result.current.updateCellValue(secondCell.id, 3);
      });

      expect(result.current.isValid).toBe(false);

      // Resolve duplicate
      act(() => {
        result.current.updateCellValue(secondCell.id, 4);
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.validationErrors).toHaveLength(0);
    });

    test('should correctly identify when puzzle is solved', () => {
      const { result } = renderHook(() => usePuzzleSession(validPuzzleDescription));

      expect(result.current.isSolved).toBe(true);
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle session without id gracefully in export', () => {
      const puzzleWithoutId: IPuzzleDescription = {
        id: '',
        description: '',
        type: 'sudoku',
        level: 1,
        rows: 9,
        cols: 9,
        cells: '.'.repeat(81)
      };

      const { result } = renderHook(() => usePuzzleSession(puzzleWithoutId));

      const exported = result.current.exportPuzzle();

      expect(exported?.id).toBe('exported-puzzle'); // Default fallback
      expect(exported?.description).toBe('Exported Puzzle'); // Default fallback
    });

    test('should handle navigation to non-existent cell gracefully', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Select a cell at the bottom right
      const bottomRightCell = result.current.cellDisplayInfo.find(
        (cell) => cell.row === 8 && cell.column === 8
      );
      expect(bottomRightCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(bottomRightCell!.id);
      });

      // Try to navigate right beyond the edge with no wrapping
      act(() => {
        result.current.navigateToCell('right');
      });

      // Should stay at the same cell
      expect(result.current.selectedCell).toBe(bottomRightCell?.id);
    });

    test('should handle corrupted cell contents gracefully', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // The hook should handle cases where getCellContents fails
      expect(result.current.cellDisplayInfo).toHaveLength(81);

      // All cells should have empty contents by default
      result.current.cellDisplayInfo.forEach((cell) => {
        expect(cell.contents.value).toBeUndefined();
        expect(cell.contents.notes).toEqual([]);
        expect(cell.hasValidationError).toBe(false);
      });
    });
  });
});
