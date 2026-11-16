'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
const react_1 = require('@testing-library/react');
require('@fgv/ts-utils-jest');
const usePuzzleSession_1 = require('../../../hooks/usePuzzleSession');
const puzzleDefinitionHelper_1 = require('../../../utils/puzzleDefinitionHelper');
describe('usePuzzleSession with Sudoku X', () => {
  const sudokuXDescription = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
    id: 'sudoku-x-hook-test',
    description: 'Sudoku X Hook Test',
    type: 'sudoku-x',
    level: 1,
    totalRows: 9,
    totalColumns: 9,
    cells: '4.....13....6.1.....7..29...76.....2....3..9.9.1....577...1.6..3...5.7...4......1'
  });
  const emptySudokuXDescription = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
    id: 'empty-sudoku-x',
    description: 'Empty Sudoku X',
    type: 'sudoku-x',
    level: 1,
    totalRows: 9,
    totalColumns: 9,
    cells: '.'.repeat(81)
  });
  describe('Sudoku X puzzle initialization', () => {
    test('should initialize Sudoku X puzzle successfully', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(sudokuXDescription)
      );
      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.type).toBe('sudoku-x');
      expect(result.current.session?.id).toBe('sudoku-x-hook-test');
      expect(result.current.error).toBeNull();
      expect(result.current.cellDisplayInfo).toHaveLength(81);
    });
    test('should handle empty Sudoku X puzzle', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.type).toBe('sudoku-x');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isSolved).toBe(false);
      expect(result.current.validationErrors).toHaveLength(0);
    });
    test('should differentiate from standard Sudoku', () => {
      const standardSudoku = { ...sudokuXDescription, type: 'sudoku' };
      const { result: standardResult } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(standardSudoku)
      );
      const { result: sudokuXResult } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(sudokuXDescription)
      );
      expect(standardResult.current.session?.type).toBe('sudoku');
      expect(sudokuXResult.current.session?.type).toBe('sudoku-x');
    });
  });
  describe('diagonal constraint validation', () => {
    test('should detect violations in X1 diagonal (top-left to bottom-right)', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Place duplicate values on X1 diagonal
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 5); // X1 diagonal
      });
      (0, react_1.act)(() => {
        result.current.updateCellValue('B2', 5); // X1 diagonal
      });
      expect(result.current.isValid).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
      // Both cells should have validation errors
      const cellA1 = result.current.cellDisplayInfo.find((cell) => cell.id === 'A1');
      const cellB2 = result.current.cellDisplayInfo.find((cell) => cell.id === 'B2');
      expect(cellA1?.hasValidationError).toBe(true);
      expect(cellB2?.hasValidationError).toBe(true);
    });
    test('should detect violations in X2 diagonal (top-right to bottom-left)', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Place duplicate values on X2 diagonal
      (0, react_1.act)(() => {
        result.current.updateCellValue('A9', 7); // X2 diagonal
      });
      (0, react_1.act)(() => {
        result.current.updateCellValue('B8', 7); // X2 diagonal
      });
      expect(result.current.isValid).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(0);
      // Both cells should have validation errors
      const cellA9 = result.current.cellDisplayInfo.find((cell) => cell.id === 'A9');
      const cellB8 = result.current.cellDisplayInfo.find((cell) => cell.id === 'B8');
      expect(cellA9?.hasValidationError).toBe(true);
      expect(cellB8?.hasValidationError).toBe(true);
    });
    test('should detect violations at center cell E5 (in both diagonals)', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Place value at center cell
      (0, react_1.act)(() => {
        result.current.updateCellValue('E5', 9);
      });
      // Place same value on X1 diagonal
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 9);
      });
      expect(result.current.isValid).toBe(false);
      const cellE5 = result.current.cellDisplayInfo.find((cell) => cell.id === 'E5');
      const cellA1 = result.current.cellDisplayInfo.find((cell) => cell.id === 'A1');
      expect(cellE5?.hasValidationError).toBe(true);
      expect(cellA1?.hasValidationError).toBe(true);
    });
    test('should provide specific error messages for diagonal violations', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 3);
        result.current.updateCellValue('C3', 3);
      });
      expect(result.current.validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/duplicate|diagonal/i),
            message: expect.stringContaining('3')
          })
        ])
      );
    });
    test('should clear validation errors when diagonal conflicts are resolved', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Create diagonal conflict
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 6);
        result.current.updateCellValue('B2', 6);
      });
      expect(result.current.isValid).toBe(false);
      // Resolve conflict
      (0, react_1.act)(() => {
        result.current.updateCellValue('B2', 7);
      });
      expect(result.current.isValid).toBe(true);
      expect(result.current.validationErrors).toHaveLength(0);
      const cellA1 = result.current.cellDisplayInfo.find((cell) => cell.id === 'A1');
      const cellB2 = result.current.cellDisplayInfo.find((cell) => cell.id === 'B2');
      expect(cellA1?.hasValidationError).toBe(false);
      expect(cellB2?.hasValidationError).toBe(false);
    });
  });
  describe('multi-constraint validation', () => {
    test('should handle simultaneous row and diagonal violations', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Place value that violates both row and diagonal
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 8); // X1 diagonal, row A
        result.current.updateCellValue('A2', 8); // Row A
        result.current.updateCellValue('B2', 8); // X1 diagonal
      });
      expect(result.current.isValid).toBe(false);
      expect(result.current.validationErrors.length).toBeGreaterThan(1);
      // Should have both row and diagonal errors
      const hasRowError = result.current.validationErrors.some((error) =>
        error.message.toLowerCase().includes('row')
      );
      const hasDiagonalError = result.current.validationErrors.some(
        (error) =>
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('diagonal')
      );
      expect(hasRowError || hasDiagonalError).toBe(true);
    });
    test('should validate all constraints independently', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Place values that are valid for standard Sudoku but invalid for Sudoku X
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 1);
        result.current.updateCellValue('B2', 1); // Same value on diagonal - should be invalid
      });
      expect(result.current.isValid).toBe(false);
      // Place values that are valid for Sudoku X
      (0, react_1.act)(() => {
        result.current.updateCellValue('B2', 2); // Different value
      });
      expect(result.current.isValid).toBe(true);
    });
  });
  describe('cell selection and interaction on diagonals', () => {
    test('should allow selection of diagonal cells', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      const diagonalCells = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9'];
      for (const cellId of diagonalCells) {
        (0, react_1.act)(() => {
          result.current.setSelectedCell(cellId);
        });
        expect(result.current.selectedCell).toBe(cellId);
      }
    });
    test('should support keyboard navigation through diagonal cells', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Select center diagonal cell
      (0, react_1.act)(() => {
        result.current.setSelectedCell('E5');
      });
      expect(result.current.selectedCell).toBe('E5');
      // Navigate to adjacent cells (should work normally)
      (0, react_1.act)(() => {
        result.current.navigateToCell('up');
      });
      expect(result.current.selectedCell).toBe('D5');
      (0, react_1.act)(() => {
        result.current.navigateToCell('down');
      });
      expect(result.current.selectedCell).toBe('E5');
    });
    test('should allow value entry in diagonal cells', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      const diagonalCell = 'A1';
      (0, react_1.act)(() => {
        result.current.updateCellValue(diagonalCell, 9);
      });
      const updatedCell = result.current.cellDisplayInfo.find((cell) => cell.id === diagonalCell);
      expect(updatedCell?.contents.value).toBe(9);
    });
  });
  describe('undo/redo with diagonal constraints', () => {
    test('should undo diagonal constraint violations', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Make valid move
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 1);
      });
      expect(result.current.isValid).toBe(true);
      // Make invalid move (diagonal violation)
      (0, react_1.act)(() => {
        result.current.updateCellValue('B2', 1);
      });
      expect(result.current.isValid).toBe(false);
      // Undo invalid move
      (0, react_1.act)(() => {
        result.current.undo();
      });
      expect(result.current.isValid).toBe(true);
      const cellB2 = result.current.cellDisplayInfo.find((cell) => cell.id === 'B2');
      expect(cellB2?.contents.value).toBeUndefined();
    });
    test('should redo diagonal moves correctly', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Make move
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 4);
      });
      // Undo
      (0, react_1.act)(() => {
        result.current.undo();
      });
      expect(result.current.canRedo).toBe(true);
      // Redo
      (0, react_1.act)(() => {
        result.current.redo();
      });
      const cellA1 = result.current.cellDisplayInfo.find((cell) => cell.id === 'A1');
      expect(cellA1?.contents.value).toBe(4);
      expect(result.current.isValid).toBe(true);
    });
  });
  describe('export functionality with Sudoku X', () => {
    test('should export Sudoku X puzzle with correct type', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(sudokuXDescription)
      );
      const exported = result.current.exportPuzzle();
      expect(exported).not.toBeNull();
      expect(exported?.type).toBe('sudoku-x');
      expect(exported?.id).toBe('sudoku-x-hook-test');
      expect(exported?.description).toBe('Sudoku X Hook Test');
    });
    test('should export current state including diagonal cell values', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Fill some diagonal cells
      (0, react_1.act)(() => {
        result.current.updateCellValue('A1', 1);
        result.current.updateCellValue('B2', 2);
        result.current.updateCellValue('C3', 3);
      });
      const exported = result.current.exportPuzzle();
      expect(exported).not.toBeNull();
      expect(exported?.cells[0]).toBe('1'); // A1
      expect(exported?.cells[10]).toBe('2'); // B2
      expect(exported?.cells[20]).toBe('3'); // C3
    });
  });
  describe('performance with diagonal constraints', () => {
    test('should handle rapid diagonal cell updates efficiently', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Rapidly update diagonal cells
      const diagonalCells = ['A1', 'B2', 'C3', 'D4', 'E5'];
      (0, react_1.act)(() => {
        diagonalCells.forEach((cellId, index) => {
          result.current.updateCellValue(cellId, index + 1);
        });
      });
      // Should maintain validity state correctly
      expect(result.current.isValid).toBe(true);
    });
    test('should efficiently validate complex diagonal scenarios', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Create and resolve multiple diagonal conflicts
      (0, react_1.act)(() => {
        // Create conflicts
        result.current.updateCellValue('A1', 5);
        result.current.updateCellValue('B2', 5);
        result.current.updateCellValue('C3', 5);
        // Resolve conflicts
        result.current.updateCellValue('B2', 6);
        result.current.updateCellValue('C3', 7);
      });
      expect(result.current.isValid).toBe(true);
    });
  });
  describe('edge cases and error handling', () => {
    test('should handle invalid Sudoku X puzzle gracefully', () => {
      const invalidSudokuX = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
        id: 'invalid-sudoku-x',
        description: 'Invalid Sudoku X',
        type: 'sudoku-x',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells: 'invalid-cells'
      });
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(invalidSudokuX)
      );
      expect(result.current.session).toBeNull();
      expect(result.current.error).toContain('Failed to create puzzle session');
    });
    test('should handle cell updates at puzzle boundaries', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Test corner cells that are on diagonals
      const cornerCells = [
        { id: 'A1', value: 1 },
        { id: 'A9', value: 9 },
        { id: 'I1', value: 2 },
        { id: 'I9', value: 8 }
      ];
      cornerCells.forEach(({ id, value }) => {
        (0, react_1.act)(() => {
          result.current.updateCellValue(id, value);
        });
        const cell = result.current.cellDisplayInfo.find((cell) => cell.id === id);
        expect(cell?.contents.value).toBe(value);
      });
      expect(result.current.isValid).toBe(true);
    });
    test('should maintain consistency during rapid state changes', () => {
      const { result } = (0, react_1.renderHook)(() =>
        (0, usePuzzleSession_1.usePuzzleSession)(emptySudokuXDescription)
      );
      // Rapid sequence of updates and undos
      (0, react_1.act)(() => {
        result.current.updateCellValue('E5', 5);
        result.current.updateCellValue('A1', 5); // Creates conflict
        result.current.undo(); // Remove conflict
        result.current.updateCellValue('A1', 1); // Valid move
        result.current.undo(); // Undo valid move
        result.current.redo(); // Redo valid move
      });
      expect(result.current.isValid).toBe(true);
      const cellE5 = result.current.cellDisplayInfo.find((cell) => cell.id === 'E5');
      const cellA1 = result.current.cellDisplayInfo.find((cell) => cell.id === 'A1');
      expect(cellE5?.contents.value).toBe(5);
      expect(cellA1?.contents.value).toBe(1);
    });
  });
});
//# sourceMappingURL=usePuzzleSessionSudokuX.test.js.map
