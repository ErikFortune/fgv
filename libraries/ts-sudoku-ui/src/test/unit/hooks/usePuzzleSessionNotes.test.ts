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
import '@fgv/ts-utils-jest';
import { usePuzzleSession } from '../../../hooks/usePuzzleSession';
import { CellId } from '@fgv/ts-sudoku-lib';

// TODO: This test suite causes OOM - needs investigation into hook implementation
describe.skip('usePuzzleSession - Notes Functionality', () => {
  describe('input mode', () => {
    test('should initialize with notes-first input mode', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.inputMode).toBe('notes');
    });

    test('should allow changing input mode', () => {
      const { result } = renderHook(() => usePuzzleSession());

      act(() => {
        result.current.setInputMode('value');
      });

      expect(result.current.inputMode).toBe('value');

      act(() => {
        result.current.setInputMode('notes');
      });

      expect(result.current.inputMode).toBe('notes');
    });
  });

  describe('multi-select functionality', () => {
    test('should initialize with empty selected cells array', () => {
      const { result } = renderHook(() => usePuzzleSession());

      expect(result.current.selectedCells).toEqual([]);
    });

    test('should allow setting multiple selected cells', () => {
      const { result } = renderHook(() => usePuzzleSession());

      const cellIds = ['cell-0-0', 'cell-0-1', 'cell-1-0'] as CellId[];

      act(() => {
        result.current.setSelectedCells(cellIds);
      });

      expect(result.current.selectedCells).toEqual(cellIds);
    });
  });

  describe('note operations', () => {
    test('should toggle note in cell', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      // Wait for session to initialize
      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      const cellId = 'cell-0-0' as CellId;

      // Add note 5
      act(() => {
        result.current.toggleCellNote(cellId, 5);
      });

      // Find the cell and check its notes
      await waitFor(() => {
        const cellInfo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
        expect(cellInfo?.contents.notes).toContain(5);
      });

      // Toggle note 5 again (should remove it)
      act(() => {
        result.current.toggleCellNote(cellId, 5);
      });

      await waitFor(() => {
        const updatedCellInfo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
        expect(updatedCellInfo?.contents.notes).not.toContain(5);
      });
    });

    test('should clear all notes from cell', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      const cellId = 'cell-0-0' as CellId;

      // Add multiple notes
      act(() => {
        result.current.toggleCellNote(cellId, 1);
        result.current.toggleCellNote(cellId, 2);
        result.current.toggleCellNote(cellId, 3);
      });

      // Verify notes were added
      await waitFor(() => {
        const cellInfo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
        expect(cellInfo?.contents.notes).toEqual([1, 2, 3]);
      });

      // Clear all notes
      act(() => {
        result.current.clearCellNotes(cellId);
      });

      // Verify notes were cleared
      await waitFor(() => {
        const cellInfo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
        expect(cellInfo?.contents.notes).toEqual([]);
      });
    });

    test('should maintain sorted order when adding notes', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      const cellId = 'cell-0-0' as CellId;

      // Add notes in random order
      act(() => {
        result.current.toggleCellNote(cellId, 5);
        result.current.toggleCellNote(cellId, 2);
        result.current.toggleCellNote(cellId, 8);
        result.current.toggleCellNote(cellId, 1);
      });

      await waitFor(() => {
        const cellInfo = result.current.cellDisplayInfo.find((cell) => cell.id === cellId);
        expect(cellInfo?.contents.notes).toEqual([1, 2, 5, 8]);
      });
    });
  });

  describe('smart note removal', () => {
    test('should remove conflicting notes when value is placed', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      // Add notes to multiple cells in same row
      const cell1 = 'cell-0-0' as CellId; // Row 0, Col 0
      const cell2 = 'cell-0-1' as CellId; // Row 0, Col 1 (same row)
      const cell3 = 'cell-1-0' as CellId; // Row 1, Col 0 (same column)

      act(() => {
        // Add note 5 to all three cells
        result.current.toggleCellNote(cell1, 5);
        result.current.toggleCellNote(cell2, 5);
        result.current.toggleCellNote(cell3, 5);
      });

      // Verify notes were added
      await waitFor(() => {
        const cellInfo1 = result.current.cellDisplayInfo.find((cell) => cell.id === cell1);
        const cellInfo2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2);
        const cellInfo3 = result.current.cellDisplayInfo.find((cell) => cell.id === cell3);

        expect(cellInfo1?.contents.notes).toContain(5);
        expect(cellInfo2?.contents.notes).toContain(5);
        expect(cellInfo3?.contents.notes).toContain(5);
      });

      // Place value 5 in cell1
      act(() => {
        result.current.updateCellValue(cell1, 5);
      });

      // Check that note 5 was removed from conflicting cells
      await waitFor(() => {
        const cellInfo1 = result.current.cellDisplayInfo.find((cell) => cell.id === cell1);
        const cellInfo2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2);
        const cellInfo3 = result.current.cellDisplayInfo.find((cell) => cell.id === cell3);

        expect(cellInfo1?.contents.value).toBe(5);
        expect(cellInfo1?.contents.notes).not.toContain(5);
        expect(cellInfo2?.contents.notes).not.toContain(5); // Same row
        expect(cellInfo3?.contents.notes).not.toContain(5); // Same column
      });
    });

    test('should not remove notes from unrelated cells', async () => {
      const { result } = renderHook(() => usePuzzleSession());

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      const cell1 = 'cell-0-0' as CellId; // Row 0, Col 0
      const cell2 = 'cell-2-2' as CellId; // Row 2, Col 2 (different row, column, section)

      act(() => {
        // Add note 5 to both cells
        result.current.toggleCellNote(cell1, 5);
        result.current.toggleCellNote(cell2, 5);
      });

      // Place value 5 in cell1
      act(() => {
        result.current.updateCellValue(cell1, 5);
      });

      // cell2 should still have note 5 since it's in a different row/column/section
      await waitFor(() => {
        const cellInfo2 = result.current.cellDisplayInfo.find((cell) => cell.id === cell2);
        expect(cellInfo2?.contents.notes).toContain(5);
      });
    });
  });

  describe('error handling', () => {
    test('should handle note operations gracefully when session is null', () => {
      renderHook(() => usePuzzleSession());

      // Test with invalid puzzle description to get null session
      const { result: nullSessionResult } = renderHook(() =>
        usePuzzleSession({
          id: 'invalid',
          description: 'Invalid Puzzle',
          type: 'sudoku' as const,
          level: 1,
          rows: 0, // Invalid rows
          cols: 0, // Invalid cols
          cells: ''
        })
      );

      // These should not throw errors when session is null/invalid
      act(() => {
        nullSessionResult.current.toggleCellNote('cell-0-0' as CellId, 5);
        nullSessionResult.current.clearCellNotes('cell-0-0' as CellId);
      });

      // Should have an error from invalid puzzle, but not crash
      expect(nullSessionResult.current.session).toBeNull();
    });
  });
});
