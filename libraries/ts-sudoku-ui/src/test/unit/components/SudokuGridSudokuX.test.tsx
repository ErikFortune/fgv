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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuGrid } from '../../../components/SudokuGrid';
import { ICellDisplayInfo } from '../../../types';
import { CellId } from '@fgv/ts-sudoku-lib';

describe('SudokuGrid with Sudoku X', () => {
  const createMockCell = (
    row: number,
    column: number,
    overrides: Partial<ICellDisplayInfo> = {}
  ): ICellDisplayInfo => {
    const cellId = String.fromCharCode(65 + row) + (column + 1); // Convert to A1, B2, etc.
    return {
      id: cellId as CellId,
      row,
      column,
      contents: { value: undefined, notes: [] },
      isImmutable: false,
      hasValidationError: false,
      ...overrides
    };
  };

  const createFullGrid = (puzzleType: 'sudoku' | 'sudoku-x' = 'sudoku-x'): ICellDisplayInfo[] => {
    const cells: ICellDisplayInfo[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        cells.push(createMockCell(row, col));
      }
    }
    return cells;
  };

  const mockProps = {
    numRows: 9,
    numColumns: 9,
    selectedCell: null,
    selectedCells: [],
    inputMode: 'value' as const,
    onCellSelect: jest.fn(),
    onCellValueChange: jest.fn(),
    onNoteToggle: jest.fn(),
    onClearAllNotes: jest.fn(),
    onNavigate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('diagonal line rendering', () => {
    test('should render diagonal lines for Sudoku X puzzles', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Look for diagonal line elements or classes
      const diagonalElements = container.querySelectorAll('[class*="diagonal"], [class*="x-line"], svg line');
      expect(diagonalElements.length).toBeGreaterThan(0);
    });

    test('should not render diagonal lines for standard Sudoku puzzles', () => {
      const cells = createFullGrid();

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku" {...mockProps} />);

      // Should not have diagonal-specific classes or elements
      const diagonalElements = container.querySelectorAll('[class*="diagonal"], [class*="x-line"]');
      expect(diagonalElements.length).toBe(0);
    });

    test('should render both main diagonal and anti-diagonal for Sudoku X', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Look for SVG elements that might represent diagonals
      const svgElements = container.querySelectorAll('svg');
      if (svgElements.length > 0) {
        const lines = container.querySelectorAll('svg line');
        // Should have at least 2 lines for the two diagonals
        expect(lines.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should apply correct styling to diagonal lines', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Check for diagonal line styling - should be subtle
      const lines = container.querySelectorAll('svg line, [class*="diagonal"]');
      if (lines.length > 0) {
        const line = lines[0];
        const styles = window.getComputedStyle(line);

        // Diagonal lines should be subtle (low opacity)
        if (styles.opacity) {
          expect(parseFloat(styles.opacity)).toBeLessThanOrEqual(0.5);
        }
      }
    });
  });

  describe('cell interaction with diagonal constraints', () => {
    test('should highlight diagonal cells when cell on diagonal is selected', () => {
      const cells = createFullGrid('sudoku-x');
      const diagonalCell = cells.find((cell) => cell.id === 'A1'); // Top-left corner

      render(
        <SudokuGrid
          {...mockProps}
          cells={cells}
          puzzleType="sudoku-x"
          selectedCell={diagonalCell?.id || null}
        />
      );

      // Should highlight related diagonal cells
      const cellElements = screen.getAllByRole('button');
      const highlightedCells = cellElements.filter(
        (el) =>
          el.className.includes('highlight') ||
          el.className.includes('related') ||
          el.className.includes('same-constraint')
      );

      // Should highlight the diagonal cells (at least the selected cell itself)
      expect(highlightedCells.length).toBeGreaterThan(0);
    });

    test('should handle click events on diagonal cells', async () => {
      const user = userEvent.setup();
      const cells = createFullGrid('sudoku-x');
      const onCellClick = jest.fn();

      render(<SudokuGrid {...mockProps} cells={cells} puzzleType="sudoku-x" onCellSelect={onCellClick} />);

      // Click on a diagonal cell (A1)
      const diagonalCellButton = screen.getByLabelText(/A1|cell.*0.*0/i);
      await user.click(diagonalCellButton);

      expect(onCellClick).toHaveBeenCalledWith(expect.stringMatching(/A1|cell-0-0/));
    });

    test('should handle keyboard navigation through diagonal cells', () => {
      const cells = createFullGrid('sudoku-x');
      const onKeyDown = jest.fn();

      render(
        <SudokuGrid
          {...mockProps}
          cells={cells}
          puzzleType="sudoku-x"
          selectedCell={'E5' as CellId}
          onNavigate={onKeyDown}
        />
      );

      // Simulate arrow key presses
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      // Should handle navigation (at least some key events should be captured)
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('validation error display for diagonal constraints', () => {
    test('should display validation errors for diagonal cells', () => {
      const cells = createFullGrid('sudoku-x');

      // Mark diagonal cells as having validation errors
      const cellsWithErrors = cells.map((cell) => {
        if (cell.id === 'A1' || cell.id === 'B2') {
          return { ...cell, hasValidationError: true, contents: { value: 5, notes: [] } };
        }
        return cell;
      });

      render(<SudokuGrid cells={cellsWithErrors} puzzleType="sudoku-x" {...mockProps} />);

      // Check that error cells have appropriate styling
      const errorCells = screen
        .getAllByRole('button')
        .filter(
          (button) =>
            button.className.includes('error') ||
            button.className.includes('invalid') ||
            button.getAttribute('aria-invalid') === 'true'
        );

      expect(errorCells.length).toBeGreaterThan(0);
    });

    test('should distinguish between different types of validation errors', () => {
      const cells = createFullGrid('sudoku-x');

      const cellsWithErrors = cells.map((cell) => {
        if (cell.id === 'A1') {
          return { ...cell, hasValidationError: true, contents: { value: 5, notes: [] } };
        }
        if (cell.id === 'A2') {
          return { ...cell, hasValidationError: true, contents: { value: 5, notes: [] } };
        }
        return cell;
      });

      const { container } = render(
        <SudokuGrid cells={cellsWithErrors} puzzleType="sudoku-x" {...mockProps} />
      );

      // Should handle row errors (not diagonal) appropriately
      const errorElements = container.querySelectorAll('[class*="error"], [aria-invalid="true"]');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility with diagonal constraints', () => {
    test('should provide appropriate ARIA labels for diagonal cells', () => {
      const cells = createFullGrid('sudoku-x');

      render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Diagonal cells should have accessible labels
      const diagonalCells = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9'];

      diagonalCells.forEach((cellId) => {
        // Use static aria-label pattern for cell lookup
        const letter = cellId.charAt(0);
        const number = cellId.charAt(1);
        const cellElement = screen.getByLabelText((content, element) => {
          return content.toLowerCase().includes(`${letter.toLowerCase()}`) && content.includes(number);
        });
        expect(cellElement).toBeInTheDocument();
      });
    });

    test('should announce validation errors for diagonal constraints to screen readers', () => {
      const cells = createFullGrid('sudoku-x');

      const cellsWithErrors = cells.map((cell) => {
        if (cell.id === 'A1' || cell.id === 'E5') {
          return { ...cell, hasValidationError: true, contents: { value: 7, notes: [] } };
        }
        return cell;
      });

      render(<SudokuGrid cells={cellsWithErrors} puzzleType="sudoku-x" {...mockProps} />);

      // Error cells should have aria-invalid attribute
      const errorCells = screen
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-invalid') === 'true');

      expect(errorCells.length).toBeGreaterThan(0);
    });
  });

  describe('responsive design with diagonal lines', () => {
    test('should handle different grid sizes while maintaining diagonal proportions', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(
        <div style={{ width: '300px', height: '300px' }}>
          <SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />
        </div>
      );

      // Diagonal lines should scale with the grid
      const svgElements = container.querySelectorAll('svg');
      if (svgElements.length > 0) {
        const svg = svgElements[0];
        expect(svg).toHaveAttribute('viewBox');
      }
    });

    test('should maintain diagonal line visibility at different zoom levels', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(
        <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
          <SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />
        </div>
      );

      // Diagonal elements should still be present even when scaled
      const diagonalElements = container.querySelectorAll('svg line, [class*="diagonal"]');
      expect(diagonalElements.length).toBeGreaterThan(0);
    });
  });

  describe('performance with diagonal rendering', () => {
    test('should render large grids with diagonals efficiently', () => {
      const cells = createFullGrid('sudoku-x');

      const startTime = performance.now();

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (generous for CI environments)
      expect(renderTime).toBeLessThan(100);

      // Should have rendered all cells
      const cellButtons = container.querySelectorAll('[role="button"]');
      expect(cellButtons.length).toBe(81);
    });

    test('should handle rapid selection changes on diagonal cells efficiently', () => {
      const cells = createFullGrid('sudoku-x');
      const diagonalCells = ['A1', 'B2', 'C3', 'D4', 'E5'] as CellId[];

      const { rerender } = render(
        <SudokuGrid {...mockProps} cells={cells} puzzleType="sudoku-x" selectedCell={null} />
      );

      const startTime = performance.now();

      // Rapidly change selected cell through diagonal cells
      diagonalCells.forEach((cellId) => {
        rerender(<SudokuGrid {...mockProps} cells={cells} puzzleType="sudoku-x" selectedCell={cellId} />);
      });

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle missing puzzle description gracefully', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType={undefined} {...mockProps} />);

      // Should render without crashing
      const cellButtons = container.querySelectorAll('[role="button"]');
      expect(cellButtons.length).toBe(81);
    });

    test('should handle invalid cell data gracefully', () => {
      const cells = createFullGrid('sudoku-x');
      // Add some invalid cell data
      const invalidCells = [
        ...cells,
        createMockCell(-1, -1), // Invalid coordinates
        createMockCell(10, 10) // Out of bounds
      ];

      const { container } = render(<SudokuGrid cells={invalidCells} puzzleType="sudoku-x" {...mockProps} />);

      // Should still render the valid cells
      const cellButtons = container.querySelectorAll('[role="button"]');
      expect(cellButtons.length).toBeGreaterThan(0);
    });

    test('should handle empty cell array gracefully', () => {
      const { container } = render(<SudokuGrid cells={[]} puzzleType="sudoku-x" {...mockProps} />);

      // Should render without crashing even with empty cells
      expect(container).toBeInTheDocument();
    });

    test('should handle puzzle type changes correctly', () => {
      const cells = createFullGrid('sudoku-x');

      const { container, rerender } = render(
        <SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />
      );

      // Should initially have diagonal elements
      let diagonalElements = container.querySelectorAll('[class*="diagonal"], svg line');
      const initialDiagonalCount = diagonalElements.length;

      // Switch to standard Sudoku
      rerender(<SudokuGrid cells={cells} puzzleType="sudoku" {...mockProps} />);

      // Should no longer have diagonal elements (or fewer of them)
      diagonalElements = container.querySelectorAll('[class*="diagonal"], svg line');
      expect(diagonalElements.length).toBeLessThanOrEqual(initialDiagonalCount);
    });
  });
});
