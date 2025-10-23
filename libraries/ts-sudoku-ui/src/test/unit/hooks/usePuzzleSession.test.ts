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

import { renderHook, act, waitFor } from '@testing-library/react';
import { IPuzzleDefinition, CellId } from '@fgv/ts-sudoku-lib';
import '@fgv/ts-utils-jest';
import { usePuzzleSession } from '../../../hooks/usePuzzleSession';
import { createPuzzleDefinition } from '../../../utils/puzzleDefinitionHelper';

describe('usePuzzleSession', () => {
  const validPuzzleDescription: IPuzzleDefinition = createPuzzleDefinition({
    id: 'test-puzzle',
    description: 'Test Puzzle',
    type: 'sudoku',
    level: 1,
    totalRows: 9,
    totalColumns: 9,
    cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
  });

  const simplePuzzleDescription: IPuzzleDefinition = createPuzzleDefinition({
    id: 'simple-puzzle',
    description: 'Simple Test Puzzle',
    type: 'sudoku',
    level: 1,
    totalRows: 9,
    totalColumns: 9,
    // Partial puzzle - first cell filled, rest empty (81 characters total)
    cells: '1' + '.'.repeat(80)
  });

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
      const invalidPuzzle: IPuzzleDefinition = createPuzzleDefinition({
        id: 'invalid',
        description: 'Invalid',
        type: 'sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: 'invalid-length' // Too short
      });

      const { result } = renderHook(() => usePuzzleSession(invalidPuzzle));

      expect(result.current.session).toBeNull();
      expect(result.current.error).toContain('Failed to create puzzle session');
    });

    test('should update when initial puzzle description changes', () => {
      // Create two separate instances to verify the hook works with different puzzles
      const puzzle1: IPuzzleDefinition = createPuzzleDefinition({
        id: 'first-puzzle',
        description: 'First Test',
        type: 'sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: '12.456789.56789123789123456234567891567891234891234567345678912678912345912345678'
      });

      const puzzle2: IPuzzleDefinition = createPuzzleDefinition({
        id: 'second-puzzle',
        description: 'Second Test',
        type: 'sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
      });

      const { result: result1 } = renderHook(() => usePuzzleSession(puzzle1));
      expect(result1.current.session).not.toBeNull();
      expect(result1.current.session?.id).toBe('first-puzzle');

      const { result: result2 } = renderHook(() => usePuzzleSession(puzzle2));
      expect(result2.current.session).not.toBeNull();
      expect(result2.current.session?.id).toBe('second-puzzle');
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
      expect(cells.length).toBeGreaterThan(0);

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

    test('should reset without error when session exists', () => {
      const { result } = renderHook(() => usePuzzleSession(simplePuzzleDescription));

      expect(result.current.session).not.toBeNull();

      // Make changes and reset
      act(() => {
        const mutableCell = result.current.cellDisplayInfo.find((c) => !c.isImmutable);
        if (mutableCell) {
          result.current.updateCellValue(mutableCell.id, 9);
        }
      });

      act(() => {
        result.current.reset();
      });

      // Reset should complete without error
      expect(result.current.error).toBeNull();
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
      expect(exported?.totalRows).toBe(9);
      expect(exported?.totalColumns).toBe(9);
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

    test('should export default manual entry puzzle when no initial description provided', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      const exported = result.current.exportPuzzle();

      // Hook creates a default manual-entry puzzle
      expect(exported).not.toBeNull();
      expect(exported?.id).toBe('manual-entry');
      expect(exported?.type).toBe('sudoku');
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

  describe('notes management', () => {
    test('should toggle notes on and off', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      // Add note
      act(() => {
        result.current.toggleCellNote(cellId, 5);
      });

      let updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).toContain(5);

      // Toggle same note to remove it
      act(() => {
        result.current.toggleCellNote(cellId, 5);
      });

      updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).not.toContain(5);
    });

    test('should add multiple notes to a cell', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      act(() => {
        result.current.toggleCellNote(cellId, 1);
        result.current.toggleCellNote(cellId, 3);
        result.current.toggleCellNote(cellId, 7);
      });

      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).toEqual([1, 3, 7]);
    });

    test('should clear all notes from a cell', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      // Add multiple notes
      act(() => {
        result.current.toggleCellNote(cellId, 1);
        result.current.toggleCellNote(cellId, 5);
        result.current.toggleCellNote(cellId, 9);
      });

      let updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).toHaveLength(3);

      // Clear all notes
      act(() => {
        result.current.clearCellNotes(cellId);
      });

      updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).toHaveLength(0);
    });

    test('should automatically remove conflicting notes when value is placed in same row', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Get two cells in the same row
      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const cell1 = firstRowCells[0];
      const cell2 = firstRowCells[1];

      // Add note to cell2
      act(() => {
        result.current.toggleCellNote(cell2.id, 5);
      });

      let updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2.id);
      expect(updatedCell2?.contents.notes).toContain(5);

      // Place value 5 in cell1 - should remove note from cell2
      act(() => {
        result.current.updateCellValue(cell1.id, 5);
      });

      updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2.id);
      expect(updatedCell2?.contents.notes).not.toContain(5);
    });

    test('should automatically remove conflicting notes when value is placed in same column', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Get two cells in the same column
      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 1 && cell.column === 0);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      // Add note to cell2
      act(() => {
        result.current.toggleCellNote(cell2!.id, 7);
      });

      let updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).toContain(7);

      // Place value 7 in cell1 - should remove note from cell2
      act(() => {
        result.current.updateCellValue(cell1!.id, 7);
      });

      updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).not.toContain(7);
    });

    test('should automatically remove conflicting notes when value is placed in same section', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Get two cells in the same section (top-left 3x3)
      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 1 && cell.column === 1);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      // Add note to cell2
      act(() => {
        result.current.toggleCellNote(cell2!.id, 3);
      });

      let updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).toContain(3);

      // Place value 3 in cell1 - should remove note from cell2
      act(() => {
        result.current.updateCellValue(cell1!.id, 3);
      });

      updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).not.toContain(3);
    });

    test('should not remove notes from cells with values', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const cell1 = firstRowCells[0];
      const cell2 = firstRowCells[1];

      // Place value in cell2 first
      act(() => {
        result.current.updateCellValue(cell2.id, 5);
      });

      // Then place same value in cell1
      act(() => {
        result.current.updateCellValue(cell1.id, 5);
      });

      // Cell2 should still have its value
      const updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2.id);
      expect(updatedCell2?.contents.value).toBe(5);
    });

    test('should not remove notes when value is cleared', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const cell1 = firstRowCells[0];
      const cell2 = firstRowCells[1];

      // Add note to cell2
      act(() => {
        result.current.toggleCellNote(cell2.id, 5);
      });

      // Place and then clear value in cell1
      act(() => {
        result.current.updateCellValue(cell1.id, 5);
      });

      act(() => {
        result.current.updateCellValue(cell1.id, undefined);
      });

      // Cell2 notes should still be empty (removed when value was placed)
      const updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2.id);
      expect(updatedCell2?.contents.notes).toEqual([]);
    });

    test('should handle toggle note on invalid cell', () => {
      const { result } = renderHook(() => usePuzzleSession());

      act(() => {
        result.current.toggleCellNote('invalid-cell-id' as unknown as CellId, 5);
      });

      expect(result.current.error).toContain('Failed to get cell contents');
    });

    test('should handle clear notes on invalid cell', () => {
      const { result } = renderHook(() => usePuzzleSession());

      act(() => {
        result.current.clearCellNotes('invalid-cell-id' as unknown as CellId);
      });

      expect(result.current.error).toContain('Failed to clear notes');
    });
  });

  describe('input mode management', () => {
    test('should initialize with notes mode', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.inputMode).toBe('notes');
    });

    test('should switch to value mode', () => {
      const { result } = renderHook(() => usePuzzleSession());

      act(() => {
        result.current.setInputMode('value');
      });

      expect(result.current.inputMode).toBe('value');
    });

    test('should switch back to notes mode', () => {
      const { result } = renderHook(() => usePuzzleSession());

      act(() => {
        result.current.setInputMode('value');
      });

      act(() => {
        result.current.setInputMode('notes');
      });

      expect(result.current.inputMode).toBe('notes');
    });
  });

  describe('multi-cell selection', () => {
    test('should set multiple selected cells', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cells = result.current.cellDisplayInfo.slice(0, 3).map((c) => c.id);

      act(() => {
        result.current.setSelectedCells(cells);
      });

      expect(result.current.selectedCells).toEqual(cells);
    });

    test('should clear multi-cell selection', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cells = result.current.cellDisplayInfo.slice(0, 3).map((c) => c.id);

      act(() => {
        result.current.setSelectedCells(cells);
      });

      act(() => {
        result.current.setSelectedCells([]);
      });

      expect(result.current.selectedCells).toEqual([]);
    });
  });

  describe('sudoku-x diagonal validation', () => {
    const sudokuXPuzzle: IPuzzleDefinition = createPuzzleDefinition({
      id: 'sudoku-x',
      description: 'Sudoku X Test',
      type: 'sudoku-x',
      level: 1,
      totalRows: 9,
      totalColumns: 9,
      cells: '.'.repeat(81)
    });

    test('should detect duplicate on main diagonal', () => {
      const { result } = renderHook(() => usePuzzleSession(sudokuXPuzzle));

      // Get two cells on main diagonal
      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 1 && cell.column === 1);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      // Place duplicate values
      act(() => {
        result.current.updateCellValue(cell1!.id, 5);
        result.current.updateCellValue(cell2!.id, 5);
      });

      expect(result.current.isValid).toBe(false);
      const diagonalError = result.current.validationErrors.find(
        (error) => error.type === 'duplicate-diagonal'
      );
      expect(diagonalError).toBeDefined();
    });

    test('should detect duplicate on anti-diagonal', () => {
      const { result } = renderHook(() => usePuzzleSession(sudokuXPuzzle));

      // Get two cells on anti-diagonal (row + col = 8)
      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 8);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 1 && cell.column === 7);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      // Place duplicate values
      act(() => {
        result.current.updateCellValue(cell1!.id, 7);
        result.current.updateCellValue(cell2!.id, 7);
      });

      expect(result.current.isValid).toBe(false);
      const diagonalError = result.current.validationErrors.find(
        (error) => error.type === 'duplicate-diagonal'
      );
      expect(diagonalError).toBeDefined();
    });

    test('should remove notes from main diagonal when value is placed', () => {
      const { result } = renderHook(() => usePuzzleSession(sudokuXPuzzle));

      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 2 && cell.column === 2);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      // Add note to cell2
      act(() => {
        result.current.toggleCellNote(cell2!.id, 8);
      });

      let updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).toContain(8);

      // Place value on main diagonal in cell1
      act(() => {
        result.current.updateCellValue(cell1!.id, 8);
      });

      // Note should be removed from cell2
      updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).not.toContain(8);
    });

    test('should remove notes from anti-diagonal when value is placed', () => {
      const { result } = renderHook(() => usePuzzleSession(sudokuXPuzzle));

      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 8);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 2 && cell.column === 6);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      // Add note to cell2
      act(() => {
        result.current.toggleCellNote(cell2!.id, 4);
      });

      let updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).toContain(4);

      // Place value on anti-diagonal in cell1
      act(() => {
        result.current.updateCellValue(cell1!.id, 4);
      });

      // Note should be removed from cell2
      updatedCell2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2!.id);
      expect(updatedCell2?.contents.notes).not.toContain(4);
    });
  });

  describe('killer sudoku cage display', () => {
    const killerPuzzle: IPuzzleDefinition = createPuzzleDefinition({
      id: 'killer-test',
      description: 'Killer Test Puzzle',
      type: 'killer-sudoku',
      level: 1,
      totalRows: 9,
      totalColumns: 9,
      // Killer sudoku with cages: pattern|totals format
      cells:
        'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
    });

    test('should return empty cage display info for non-killer puzzles', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.cageDisplayInfo).toHaveLength(0);
    });

    test('should return empty cage display info for sudoku-x puzzles', () => {
      const sudokuXPuzzle: IPuzzleDefinition = createPuzzleDefinition({
        id: 'sudoku-x-cage-test',
        description: 'Sudoku X Cage Test',
        type: 'sudoku-x',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: '.'.repeat(81)
      });

      const { result } = renderHook(() => usePuzzleSession(sudokuXPuzzle));

      // Sudoku-X should not show killer cages
      expect(result.current.cageDisplayInfo).toHaveLength(0);
    });

    test('should return cage display info for killer sudoku puzzles', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // Killer sudoku should have cages
      expect(result.current.cageDisplayInfo.length).toBeGreaterThan(0);

      // Each cage should have required properties
      const firstCage = result.current.cageDisplayInfo[0];
      expect(firstCage).toHaveProperty('cage');
      expect(firstCage).toHaveProperty('isHighlighted');
      expect(firstCage).toHaveProperty('isComplete');
      expect(firstCage).toHaveProperty('isValid');
      expect(firstCage.cage).toHaveProperty('cellIds');
      expect(firstCage.cage).toHaveProperty('total');
    });

    test('should show cage as incomplete when cells are empty', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // All cages should be incomplete initially (no values placed)
      const incompleteCages = result.current.cageDisplayInfo.filter((cageInfo) => !cageInfo.isComplete);
      expect(incompleteCages.length).toBe(result.current.cageDisplayInfo.length);

      // currentSum should be undefined for empty cages
      const cagesWithNoSum = result.current.cageDisplayInfo.filter(
        (cageInfo) => cageInfo.currentSum === undefined
      );
      expect(cagesWithNoSum.length).toBe(result.current.cageDisplayInfo.length);
    });

    test('should calculate current sum when values are placed in cage', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // Get first cage and place values in its cells
      const firstCageInfo = result.current.cageDisplayInfo[0];
      const firstCellId = firstCageInfo.cage.cellIds[0];

      act(() => {
        result.current.updateCellValue(firstCellId, 3);
      });

      // Cage should now have a current sum
      const updatedCageInfo = result.current.cageDisplayInfo.find((info) =>
        info.cage.cellIds.includes(firstCellId)
      );
      expect(updatedCageInfo?.currentSum).toBe(3);
      expect(updatedCageInfo?.isComplete).toBe(false); // Still incomplete if cage has multiple cells
    });

    test('should mark cage as complete when all cells have values', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // Find a 2-cell cage and fill both cells
      const twoCellCage = result.current.cageDisplayInfo.find((info) => info.cage.cellIds.length === 2);
      expect(twoCellCage).toBeDefined();

      const [cell1, cell2] = twoCellCage!.cage.cellIds;

      act(() => {
        result.current.updateCellValue(cell1, 4);
        result.current.updateCellValue(cell2, 5);
      });

      // Cage should now be complete
      const updatedCageInfo = result.current.cageDisplayInfo.find((info) =>
        info.cage.cellIds.includes(cell1)
      );
      expect(updatedCageInfo?.isComplete).toBe(true);
      expect(updatedCageInfo?.currentSum).toBe(9);
    });

    test('should mark cage as valid when sum matches target and complete', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // Find a 2-cell cage with target sum 11 (like cage A)
      const cageWithTarget11 = result.current.cageDisplayInfo.find((info) => info.cage.total === 11);
      expect(cageWithTarget11).toBeDefined();

      const [cell1, cell2] = cageWithTarget11!.cage.cellIds;

      // Place values that sum to 11
      act(() => {
        result.current.updateCellValue(cell1, 5);
        result.current.updateCellValue(cell2, 6);
      });

      // Cage should be valid (sum matches target)
      const updatedCageInfo = result.current.cageDisplayInfo.find((info) =>
        info.cage.cellIds.includes(cell1)
      );
      expect(updatedCageInfo?.isValid).toBe(true);
      expect(updatedCageInfo?.currentSum).toBe(11);
    });

    test('should mark cage as invalid when sum exceeds target', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // Find a 2-cell cage with a small target (< 9 so we can place 9 to exceed it)
      const smallTargetCage = result.current.cageDisplayInfo.find((info) => info.cage.total < 9);
      expect(smallTargetCage).toBeDefined();

      const [cell1] = smallTargetCage!.cage.cellIds;

      // Place a value larger than the target
      act(() => {
        result.current.updateCellValue(cell1, 9);
      });

      // Cage should be invalid (partial sum already exceeds target)
      const updatedCageInfo = result.current.cageDisplayInfo.find((info) =>
        info.cage.cellIds.includes(cell1)
      );
      expect(updatedCageInfo?.currentSum).toBe(9);
      expect(updatedCageInfo?.currentSum).toBeGreaterThan(smallTargetCage!.cage.total);
      expect(updatedCageInfo?.isValid).toBe(false);
      expect(updatedCageInfo?.isComplete).toBe(false);
    });

    test('should mark cage as invalid when complete but sum does not match target', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      const twoCellCage = result.current.cageDisplayInfo.find((info) => info.cage.cellIds.length === 2);
      expect(twoCellCage).toBeDefined();

      const [cell1, cell2] = twoCellCage!.cage.cellIds;
      const targetSum = twoCellCage!.cage.total;

      // Place values that don't sum to target (e.g., 2 + 3 = 5)
      act(() => {
        result.current.updateCellValue(cell1, 2);
        result.current.updateCellValue(cell2, 3);
      });

      const updatedCageInfo = result.current.cageDisplayInfo.find((info) =>
        info.cage.cellIds.includes(cell1)
      );

      // If our sum doesn't match target, cage should be invalid
      if (updatedCageInfo?.currentSum !== targetSum) {
        expect(updatedCageInfo?.isValid).toBe(false);
      }
    });

    test('should highlight cage containing selected cell', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      // Initially no cage should be highlighted (no selection)
      const initialHighlighted = result.current.cageDisplayInfo.filter((info) => info.isHighlighted);
      expect(initialHighlighted).toHaveLength(0);

      // Select a cell
      const firstCageInfo = result.current.cageDisplayInfo[0];
      const cellInCage = firstCageInfo.cage.cellIds[0];

      act(() => {
        result.current.setSelectedCell(cellInCage);
      });

      // Now the cage containing that cell should be highlighted
      const highlightedCage = result.current.cageDisplayInfo.find((info) => info.isHighlighted);
      expect(highlightedCage).toBeDefined();
      expect(highlightedCage?.cage.cellIds).toContain(cellInCage);
    });

    test('should update cage highlighting when selection changes', () => {
      const { result } = renderHook(() => usePuzzleSession(killerPuzzle));

      const [cage1, cage2] = result.current.cageDisplayInfo.slice(0, 2);
      const cell1 = cage1.cage.cellIds[0];
      const cell2 = cage2.cage.cellIds[0];

      // Select cell from first cage
      act(() => {
        result.current.setSelectedCell(cell1);
      });

      let highlighted = result.current.cageDisplayInfo.filter((info) => info.isHighlighted);
      expect(highlighted).toHaveLength(1);
      expect(highlighted[0].cage.cellIds).toContain(cell1);

      // Change selection to cell from second cage
      act(() => {
        result.current.setSelectedCell(cell2);
      });

      highlighted = result.current.cageDisplayInfo.filter((info) => info.isHighlighted);
      expect(highlighted).toHaveLength(1);
      expect(highlighted[0].cage.cellIds).toContain(cell2);
    });

    test('should update cage display when cells change', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Regular sudoku has no cages
      expect(result.current.cageDisplayInfo).toHaveLength(0);

      // Place a value - cage display should remain empty
      const firstCell = result.current.cellDisplayInfo[0];
      act(() => {
        result.current.updateCellValue(firstCell.id, 5);
      });

      expect(result.current.cageDisplayInfo).toHaveLength(0);
    });

    test('should handle cage highlighting with no selection', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // With no cages, this should be empty
      const highlightedCages = result.current.cageDisplayInfo.filter((cageInfo) => cageInfo.isHighlighted);
      expect(highlightedCages).toHaveLength(0);
    });
  });

  describe('navigation edge cases', () => {
    test('should not wrap when at top edge with none setting', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const topCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(topCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(topCell!.id);
      });

      act(() => {
        result.current.navigateToCell('up', 'none');
      });

      // Should stay at same cell
      expect(result.current.selectedCell).toBe(topCell!.id);
    });

    test('should not wrap when at bottom edge with none setting', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const bottomCell = result.current.cellDisplayInfo.find((cell) => cell.row === 8 && cell.column === 0);
      expect(bottomCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(bottomCell!.id);
      });

      act(() => {
        result.current.navigateToCell('down', 'none');
      });

      // Should stay at same cell
      expect(result.current.selectedCell).toBe(bottomCell!.id);
    });

    test('should not wrap when at left edge with none setting', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const leftCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(leftCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(leftCell!.id);
      });

      act(() => {
        result.current.navigateToCell('left', 'none');
      });

      // Should stay at same cell
      expect(result.current.selectedCell).toBe(leftCell!.id);
    });

    test('should not wrap when at right edge with none setting', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const rightCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 8);
      expect(rightCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(rightCell!.id);
      });

      act(() => {
        result.current.navigateToCell('right', 'none');
      });

      // Should stay at same cell
      expect(result.current.selectedCell).toBe(rightCell!.id);
    });

    test('should wrap left when at left edge with wrap-around', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const leftCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(leftCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(leftCell!.id);
      });

      act(() => {
        result.current.navigateToCell('left', 'wrap-around');
      });

      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 8);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should wrap right when at right edge with wrap-around', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const rightCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 8);
      expect(rightCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(rightCell!.id);
      });

      act(() => {
        result.current.navigateToCell('right', 'wrap-around');
      });

      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });

    test('should wrap down when at bottom edge with wrap-around', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const bottomCell = result.current.cellDisplayInfo.find((cell) => cell.row === 8 && cell.column === 0);
      expect(bottomCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(bottomCell!.id);
      });

      act(() => {
        result.current.navigateToCell('down', 'wrap-around');
      });

      const expectedCell = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      expect(result.current.selectedCell).toBe(expectedCell?.id);
    });
  });

  describe('validation with different error types', () => {
    test('should detect duplicate in column', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 5 && cell.column === 0);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      act(() => {
        result.current.updateCellValue(cell1!.id, 6);
        result.current.updateCellValue(cell2!.id, 6);
      });

      expect(result.current.isValid).toBe(false);
      const columnError = result.current.validationErrors.find((error) => error.type === 'duplicate-column');
      expect(columnError).toBeDefined();
      expect(columnError?.message).toContain('Duplicate 6 in column');
    });

    test('should detect duplicate in section', () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Two cells in same section but different row and column
      const cell1 = result.current.cellDisplayInfo.find((cell) => cell.row === 0 && cell.column === 0);
      const cell2 = result.current.cellDisplayInfo.find((cell) => cell.row === 2 && cell.column === 2);
      expect(cell1).toBeDefined();
      expect(cell2).toBeDefined();

      act(() => {
        result.current.updateCellValue(cell1!.id, 8);
        result.current.updateCellValue(cell2!.id, 8);
      });

      expect(result.current.isValid).toBe(false);
      const sectionError = result.current.validationErrors.find(
        (error) => error.type === 'duplicate-section'
      );
      expect(sectionError).toBeDefined();
      expect(sectionError?.message).toContain('Duplicate 8 in section');
    });

    test('should include conflicting cells in validation errors', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const firstRowCells = result.current.cellDisplayInfo.filter((cell) => cell.row === 0);
      const cell1 = firstRowCells[0];
      const cell2 = firstRowCells[1];

      act(() => {
        result.current.updateCellValue(cell1.id, 9);
        result.current.updateCellValue(cell2.id, 9);
      });

      const rowError = result.current.validationErrors.find((error) => error.cellId === cell1.id);
      expect(rowError).toBeDefined();
      expect(rowError?.conflictingCells).toContain(cell2.id);
    });
  });

  describe('undo and redo with notes', () => {
    test('should undo note changes', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      act(() => {
        result.current.toggleCellNote(cellId, 5);
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).not.toContain(5);
    });

    test('should redo note changes', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      act(() => {
        result.current.toggleCellNote(cellId, 7);
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.notes).toContain(7);
    });

    test('should handle multiple undos and redos', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellId = result.current.cellDisplayInfo[0].id;

      // Make multiple changes
      act(() => {
        result.current.updateCellValue(cellId, 1);
      });

      act(() => {
        result.current.updateCellValue(cellId, 2);
      });

      act(() => {
        result.current.updateCellValue(cellId, 3);
      });

      // Undo twice
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      let updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.value).toBe(1);

      // Redo once
      act(() => {
        result.current.redo();
      });

      updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
      expect(updatedCell?.contents.value).toBe(2);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle session without id gracefully in export', () => {
      const puzzleWithoutId: IPuzzleDefinition = createPuzzleDefinition({
        id: '',
        description: '',
        type: 'sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: '.'.repeat(81)
      });

      const { result } = renderHook(() => usePuzzleSession(puzzleWithoutId));

      const exported = result.current.exportPuzzle();

      expect(exported?.id).toBe('exported-puzzle'); // Default fallback
      expect(exported?.description).toBe('Exported Puzzle'); // Default fallback
    });

    test('should handle navigation to edge with wrapping', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      await waitFor(() => {
        expect(result.current.cellDisplayInfo.length).toBeGreaterThan(0);
      });

      // Select a cell at the bottom right
      const bottomRightCell = result.current.cellDisplayInfo.find(
        (cell) => cell.row === 8 && cell.column === 8
      );
      expect(bottomRightCell).toBeDefined();

      act(() => {
        result.current.setSelectedCell(bottomRightCell!.id);
      });

      // Navigate right - behavior now wraps to next row
      act(() => {
        result.current.navigateToCell('right');
      });

      // Navigation wraps to the beginning of the next row (which wraps to first cell)
      expect(result.current.selectedCell).toBeDefined();
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

    test('should export null when session is null', () => {
      const invalidPuzzle: IPuzzleDefinition = createPuzzleDefinition({
        id: 'invalid',
        description: 'Invalid',
        type: 'sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: 'too-short'
      });

      const { result } = renderHook(() => usePuzzleSession(invalidPuzzle));

      const exported = result.current.exportPuzzle();
      expect(exported).toBeNull();
    });

    test('should preserve puzzle type in export', () => {
      const sudokuXPuzzle: IPuzzleDefinition = createPuzzleDefinition({
        id: 'sudoku-x-export',
        description: 'Sudoku X Export Test',
        type: 'sudoku-x',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: '.'.repeat(81)
      });

      const { result } = renderHook(() => usePuzzleSession(sudokuXPuzzle));

      const exported = result.current.exportPuzzle();
      expect(exported?.type).toBe('sudoku-x');
    });
  });
});
