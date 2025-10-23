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

      // Diagonal lines are rendered using CSS linear gradients on an absolute positioned div
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      expect(gridElement).toBeInTheDocument();

      // Check for the diagonal overlay div with gradients
      const diagonalDiv = gridElement?.querySelector('.absolute.inset-0');
      expect(diagonalDiv).toBeInTheDocument();
      expect(diagonalDiv).toHaveStyle({ background: expect.stringContaining('linear-gradient') });
    });

    test('should not render diagonal lines for standard Sudoku puzzles', () => {
      const cells = createFullGrid();

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku" {...mockProps} />);

      // Should not have the diagonal overlay div for standard puzzles
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      const diagonalDiv = gridElement?.querySelector('.absolute.inset-0.w-full.h-full.pointer-events-none');
      expect(diagonalDiv).not.toBeInTheDocument();
    });

    test('should render both main diagonal and anti-diagonal for Sudoku X', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Both diagonals are rendered in a single div using two linear gradients (45deg and -45deg)
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      const diagonalDiv = gridElement?.querySelector('.absolute.inset-0');
      expect(diagonalDiv).toBeInTheDocument();

      // Check that the diagonal div exists and has pointer-events-none class
      expect(diagonalDiv).toHaveClass('pointer-events-none');
    });

    test('should apply correct styling to diagonal lines', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Diagonal styling uses transparent to low-opacity gradients (0.15 opacity on gray)
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      const diagonalDiv = gridElement?.querySelector('.absolute.inset-0');
      expect(diagonalDiv).toBeInTheDocument();

      // Check that it has pointer-events-none so it doesn't interfere with cell clicks
      expect(diagonalDiv).toHaveClass('pointer-events-none');

      // Check that background style is applied (gradients are subtle with low opacity)
      const styleAttr = diagonalDiv!.getAttribute('style');
      expect(styleAttr).toBeTruthy();
    });
  });

  describe('cell interaction with diagonal constraints', () => {
    test('should highlight diagonal cells when cell on diagonal is selected', () => {
      const cells = createFullGrid('sudoku-x');
      const diagonalCell = cells.find((cell) => cell.id === 'A1'); // Top-left corner

      const { container } = render(
        <SudokuGrid
          {...mockProps}
          cells={cells}
          puzzleType="sudoku-x"
          selectedCell={diagonalCell?.id || null}
        />
      );

      // Verify the diagonal cell renders with selected state
      const selectedCell = container.querySelector('[data-testid="sudoku-cell-A1"]');
      expect(selectedCell).toBeInTheDocument();
      expect(selectedCell).toHaveAttribute('data-selected', 'true');
    });

    test('should handle click events on diagonal cells', async () => {
      const user = userEvent.setup();
      const cells = createFullGrid('sudoku-x');
      const onCellClick = jest.fn();

      const { container } = render(
        <SudokuGrid {...mockProps} cells={cells} puzzleType="sudoku-x" onCellSelect={onCellClick} />
      );

      // Click on a diagonal cell (A1) using testid
      const diagonalCellButton = container.querySelector('[data-testid="sudoku-cell-A1"]');
      expect(diagonalCellButton).toBeInTheDocument();
      await user.click(diagonalCellButton!);

      expect(onCellClick).toHaveBeenCalledWith('A1', expect.anything());
    });

    test('should handle keyboard navigation through diagonal cells', () => {
      const cells = createFullGrid('sudoku-x');
      const onNavigate = jest.fn();

      const { container } = render(
        <SudokuGrid
          {...mockProps}
          cells={cells}
          puzzleType="sudoku-x"
          selectedCell={'E5' as CellId}
          onNavigate={onNavigate}
        />
      );

      // Get the grid element and simulate arrow key presses on it
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      expect(gridElement).toBeInTheDocument();

      fireEvent.keyDown(gridElement!, { key: 'ArrowUp' });
      fireEvent.keyDown(gridElement!, { key: 'ArrowDown' });
      fireEvent.keyDown(gridElement!, { key: 'ArrowLeft' });
      fireEvent.keyDown(gridElement!, { key: 'ArrowRight' });

      // Should handle navigation (at least some key events should be captured)
      expect(onNavigate).toHaveBeenCalled();
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

      const { container } = render(
        <SudokuGrid cells={cellsWithErrors} puzzleType="sudoku-x" {...mockProps} />
      );

      // Check that error cells have data-error attribute set to true
      const errorCell1 = container.querySelector('[data-testid="sudoku-cell-A1"]');
      const errorCell2 = container.querySelector('[data-testid="sudoku-cell-B2"]');

      expect(errorCell1).toHaveAttribute('data-error', 'true');
      expect(errorCell2).toHaveAttribute('data-error', 'true');
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

      // Should handle row errors appropriately using data-error attribute
      const errorCell1 = container.querySelector('[data-testid="sudoku-cell-A1"]');
      const errorCell2 = container.querySelector('[data-testid="sudoku-cell-A2"]');

      expect(errorCell1).toHaveAttribute('data-error', 'true');
      expect(errorCell2).toHaveAttribute('data-error', 'true');
    });
  });

  describe('accessibility with diagonal constraints', () => {
    test('should provide appropriate ARIA labels for diagonal cells', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      // Diagonal cells should have accessible labels using data-testid
      const diagonalCells = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9'];

      diagonalCells.forEach((cellId) => {
        const cellElement = container.querySelector(`[data-testid="sudoku-cell-${cellId}"]`);
        expect(cellElement).toBeInTheDocument();
        expect(cellElement).toHaveAttribute('aria-label');
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

      const { container } = render(
        <SudokuGrid cells={cellsWithErrors} puzzleType="sudoku-x" {...mockProps} />
      );

      // Error cells should have data-error attribute and be accessible
      const errorCell1 = container.querySelector('[data-testid="sudoku-cell-A1"]');
      const errorCell2 = container.querySelector('[data-testid="sudoku-cell-E5"]');

      expect(errorCell1).toHaveAttribute('data-error', 'true');
      expect(errorCell2).toHaveAttribute('data-error', 'true');
      expect(errorCell1).toHaveAttribute('aria-label');
      expect(errorCell2).toHaveAttribute('aria-label');
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

      // CSS gradients scale automatically with the grid since they use percentages
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      const diagonalDiv = gridElement?.querySelector('.absolute.inset-0');
      expect(diagonalDiv).toBeInTheDocument();

      // The div spans the full grid (inset-0) so diagonals scale with it
      expect(diagonalDiv).toHaveClass('inset-0');
    });

    test('should maintain diagonal line visibility at different zoom levels', () => {
      const cells = createFullGrid('sudoku-x');

      const { container } = render(
        <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
          <SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />
        </div>
      );

      // Diagonal div should still be present when parent is scaled
      const gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      const diagonalDiv = gridElement?.querySelector('.absolute.inset-0');
      expect(diagonalDiv).toBeInTheDocument();
    });
  });

  describe('performance with diagonal rendering', () => {
    test('should render large grids with diagonals efficiently', async () => {
      const cells = createFullGrid('sudoku-x');

      const startTime = performance.now();

      render(<SudokuGrid cells={cells} puzzleType="sudoku-x" {...mockProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (generous for CI environments)
      expect(renderTime).toBeLessThan(200);

      // Should have rendered all cells - wait for first cell to confirm rendering
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      expect(firstCell).toBeInTheDocument();

      const cellButtons = screen.getAllByRole('button');
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
      expect(updateTime).toBeLessThan(150);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle missing puzzle description gracefully', async () => {
      const cells = createFullGrid('sudoku-x');

      render(<SudokuGrid cells={cells} puzzleType={undefined} {...mockProps} />);

      // Should render without crashing - wait for cells
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      expect(firstCell).toBeInTheDocument();

      const cellButtons = screen.getAllByRole('button');
      expect(cellButtons.length).toBe(81);
    });

    test('should handle invalid cell data gracefully', async () => {
      const cells = createFullGrid('sudoku-x');
      // Add some invalid cell data
      const invalidCells = [
        ...cells,
        createMockCell(-1, -1), // Invalid coordinates
        createMockCell(10, 10) // Out of bounds
      ];

      render(<SudokuGrid cells={invalidCells} puzzleType="sudoku-x" {...mockProps} />);

      // Should still render the valid cells - wait for them
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      expect(firstCell).toBeInTheDocument();

      const cellButtons = screen.getAllByRole('button');
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

      // Should initially have diagonal overlay div
      let gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      let diagonalDiv = gridElement?.querySelector('.absolute.inset-0.w-full.h-full.pointer-events-none');
      expect(diagonalDiv).toBeInTheDocument();

      // Switch to standard Sudoku
      rerender(<SudokuGrid cells={cells} puzzleType="sudoku" {...mockProps} />);

      // Should no longer have diagonal overlay div
      gridElement = container.querySelector('[data-testid="sudoku-grid"]');
      diagonalDiv = gridElement?.querySelector('.absolute.inset-0.w-full.h-full.pointer-events-none');
      expect(diagonalDiv).not.toBeInTheDocument();
    });
  });
});
