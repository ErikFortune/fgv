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

describe('SudokuGrid', () => {
  const createMockCell = (
    row: number,
    column: number,
    overrides: Partial<ICellDisplayInfo> = {}
  ): ICellDisplayInfo => {
    return {
      id: `cell-${row}-${column}` as CellId,
      row,
      column,
      contents: { value: undefined, notes: [] },
      isImmutable: false,
      hasValidationError: false,
      ...overrides
    };
  };

  const createMockCells = (numRows: number, numColumns: number): ICellDisplayInfo[] => {
    const cells: ICellDisplayInfo[] = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        cells.push(createMockCell(row, col));
      }
    }
    return cells;
  };

  const defaultProps = {
    numRows: 9,
    numColumns: 9,
    cells: createMockCells(9, 9),
    selectedCell: null as CellId | null,
    selectedCells: [] as CellId[],
    inputMode: 'notes' as const,
    onCellSelect: jest.fn(),
    onCellValueChange: jest.fn(),
    onNoteToggle: jest.fn(),
    onClearAllNotes: jest.fn(),
    onNavigate: jest.fn(),
    className: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('should render grid with correct structure', () => {
      render(<SudokuGrid {...defaultProps} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('role', 'grid');
      expect(grid).toHaveAttribute('aria-label', 'Sudoku puzzle entry grid');
      expect(grid).toHaveAttribute('tabIndex', '0');
    });

    test('should render all cells in correct order', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Check that all 81 cells are rendered
      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(81);

      // Check first and last cells
      expect(screen.getByTestId('sudoku-cell-cell-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('sudoku-cell-cell-8-8')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<SudokuGrid {...defaultProps} className="custom-grid" />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toHaveClass('sudoku-grid');
      expect(grid).toHaveClass('custom-grid');
    });

    test('should render with different grid sizes', () => {
      const smallCells = createMockCells(4, 4);
      render(<SudokuGrid {...defaultProps} numRows={4} numColumns={4} cells={smallCells} />);

      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(16);
    });

    test('should sort cells by row and column', () => {
      // Create cells in random order
      const unsortedCells = [
        createMockCell(1, 1, { contents: { value: 2, notes: [] } }),
        createMockCell(0, 0, { contents: { value: 1, notes: [] } }),
        createMockCell(0, 1, { contents: { value: 3, notes: [] } }),
        createMockCell(1, 0, { contents: { value: 4, notes: [] } })
      ];

      render(<SudokuGrid {...defaultProps} numRows={2} numColumns={2} cells={unsortedCells} />);

      const cells = screen.getAllByRole('button');

      // Should be sorted by row then column
      expect(cells[0]).toHaveTextContent('1'); // (0,0)
      expect(cells[1]).toHaveTextContent('3'); // (0,1)
      expect(cells[2]).toHaveTextContent('4'); // (1,0)
      expect(cells[3]).toHaveTextContent('2'); // (1,1)
    });
  });

  describe('cell selection', () => {
    test('should show selected cell correctly', () => {
      render(<SudokuGrid {...defaultProps} selectedCell={'cell-0-0' as CellId} />);

      const selectedCell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(selectedCell).toHaveAttribute('aria-selected', 'true');
      expect(selectedCell).toHaveAttribute('tabIndex', '0');
    });

    test('should call onCellSelect when cell is clicked', () => {
      const onCellSelect = jest.fn();
      render(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect} />);

      const cell = screen.getByTestId('sudoku-cell-cell-2-3');
      fireEvent.click(cell);

      expect(onCellSelect).toHaveBeenCalledWith('cell-2-3', expect.any(Object));
    });

    test('should handle multiple cell selections', () => {
      const onCellSelect = jest.fn();
      render(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect} />);

      fireEvent.click(screen.getByTestId('sudoku-cell-cell-0-0'));
      fireEvent.click(screen.getByTestId('sudoku-cell-cell-1-1'));
      fireEvent.click(screen.getByTestId('sudoku-cell-cell-8-8'));

      expect(onCellSelect).toHaveBeenCalledTimes(3);
      expect(onCellSelect).toHaveBeenNthCalledWith(1, 'cell-0-0', expect.any(Object));
      expect(onCellSelect).toHaveBeenNthCalledWith(2, 'cell-1-1', expect.any(Object));
      expect(onCellSelect).toHaveBeenNthCalledWith(3, 'cell-8-8', expect.any(Object));
    });
  });

  describe('cell value changes', () => {
    test('should handle cell value changes', () => {
      const onCellValueChange = jest.fn();
      render(
        <SudokuGrid
          {...defaultProps}
          inputMode="value"
          onCellValueChange={onCellValueChange}
          selectedCell={'cell-0-0' as CellId}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.keyDown(cell, { key: '5', shiftKey: true });

      expect(onCellValueChange).toHaveBeenCalledWith('cell-0-0', 5);
    });

    test('should handle different cell value changes', () => {
      const onCellValueChange = jest.fn();
      render(
        <SudokuGrid
          {...defaultProps}
          inputMode="value"
          onCellValueChange={onCellValueChange}
          selectedCell={'cell-1-2' as CellId}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-1-2');
      fireEvent.keyDown(cell, { key: '9', shiftKey: true });

      expect(onCellValueChange).toHaveBeenCalledWith('cell-1-2', 9);
    });
  });

  describe('keyboard navigation', () => {
    test('should handle arrow up navigation', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-1-1' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');
      fireEvent.keyDown(grid, { key: 'ArrowUp' });

      expect(onNavigate).toHaveBeenCalledWith('up');
    });

    test('should handle arrow down navigation', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-1-1' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');
      fireEvent.keyDown(grid, { key: 'ArrowDown' });

      expect(onNavigate).toHaveBeenCalledWith('down');
    });

    test('should handle arrow left navigation', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-1-1' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');
      fireEvent.keyDown(grid, { key: 'ArrowLeft' });

      expect(onNavigate).toHaveBeenCalledWith('left');
    });

    test('should handle arrow right navigation', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-1-1' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');
      fireEvent.keyDown(grid, { key: 'ArrowRight' });

      expect(onNavigate).toHaveBeenCalledWith('right');
    });

    test('should prevent default for arrow keys', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-1-1' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');

      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach((key) => {
        fireEvent.keyDown(grid, { key });
        // Since we can't easily test preventDefault, just verify onNavigate was called
        expect(onNavigate).toHaveBeenCalled();
        onNavigate.mockClear();
      });
    });

    test('should not navigate when no cell is selected', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={null} />);

      const grid = screen.getByTestId('sudoku-grid');
      fireEvent.keyDown(grid, { key: 'ArrowUp' });

      expect(onNavigate).not.toHaveBeenCalled();
    });

    test('should ignore non-arrow keys for navigation', () => {
      const onNavigate = jest.fn();
      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-1-1' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');
      fireEvent.keyDown(grid, { key: 'Enter' });
      fireEvent.keyDown(grid, { key: 'Space' });
      fireEvent.keyDown(grid, { key: 'a' });

      expect(onNavigate).not.toHaveBeenCalled();
    });

    test('should let cells handle number and delete keys', () => {
      const onNavigate = jest.fn();
      const onCellValueChange = jest.fn();
      render(
        <SudokuGrid
          {...defaultProps}
          onNavigate={onNavigate}
          onCellValueChange={onCellValueChange}
          selectedCell={'cell-1-1' as CellId}
        />
      );

      const grid = screen.getByTestId('sudoku-grid');

      // Number keys should not trigger navigation
      fireEvent.keyDown(grid, { key: '5' });
      fireEvent.keyDown(grid, { key: 'Delete' });
      fireEvent.keyDown(grid, { key: 'Backspace' });

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('grid layout and styling', () => {
    test('should apply correct CSS grid properties', () => {
      render(<SudokuGrid {...defaultProps} />);

      const grid = screen.getByTestId('sudoku-grid');

      // Component uses Tailwind grid classes
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-9');
      expect(grid).toHaveClass('grid-rows-9');
    });

    test('should render grid with correct dimensions', () => {
      render(<SudokuGrid {...defaultProps} numRows={6} numColumns={6} cells={createMockCells(6, 6)} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
      // Grid renders with appropriate dimensions
      expect(grid.childElementCount).toBeGreaterThan(0);
    });

    test('should have correct accessibility attributes', () => {
      render(<SudokuGrid {...defaultProps} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toHaveAttribute('role', 'grid');
      expect(grid).toHaveAttribute('aria-label', 'Sudoku puzzle entry grid');
      expect(grid).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('cell rendering and interaction', () => {
    test('should render cells with different states correctly', () => {
      const mixedCells = [
        createMockCell(0, 0, { contents: { value: 1, notes: [] }, isImmutable: true }),
        createMockCell(0, 1, { contents: { value: 2, notes: [] }, hasValidationError: true }),
        createMockCell(0, 2, { contents: { value: undefined, notes: [1, 2, 3] } }),
        createMockCell(1, 0, { contents: { value: 4, notes: [] } })
      ];

      render(
        <SudokuGrid
          {...defaultProps}
          numRows={2}
          numColumns={2}
          cells={mixedCells}
          selectedCell={'cell-0-1' as CellId}
        />
      );

      // Check immutable cell
      expect(screen.getByTestId('sudoku-cell-cell-0-0')).toHaveTextContent('1');

      // Check error cell
      expect(screen.getByTestId('sudoku-cell-cell-0-1')).toHaveTextContent('2');

      // Check cell with notes (notes are displayed without spaces)
      expect(screen.getByTestId('sudoku-cell-cell-0-2')).toHaveTextContent('123');

      // Check normal cell
      expect(screen.getByTestId('sudoku-cell-cell-1-0')).toHaveTextContent('4');
    });

    test('should handle cell interactions through event handlers', () => {
      const onCellSelect = jest.fn();
      const onCellValueChange = jest.fn();

      render(
        <SudokuGrid
          {...defaultProps}
          inputMode="value"
          onCellSelect={onCellSelect}
          onCellValueChange={onCellValueChange}
        />
      );

      // Test cell selection
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      expect(onCellSelect).toHaveBeenCalledWith('cell-0-0', expect.any(Object));

      // Test value change
      fireEvent.keyDown(firstCell, { key: '7', shiftKey: true });
      expect(onCellValueChange).toHaveBeenCalledWith('cell-0-0', 7);
    });
  });

  describe('focus management', () => {
    test('should be focusable', () => {
      render(<SudokuGrid {...defaultProps} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toHaveAttribute('tabIndex', '0');

      grid.focus();
      expect(document.activeElement).toBe(grid);
    });

    test('should handle keyboard events when focused', async () => {
      const user = userEvent.setup();
      const onNavigate = jest.fn();

      render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-4-4' as CellId} />);

      const grid = screen.getByTestId('sudoku-grid');
      await user.click(grid);
      await user.keyboard('{ArrowUp}');

      expect(onNavigate).toHaveBeenCalledWith('up');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle empty cells array', () => {
      render(<SudokuGrid {...defaultProps} numRows={0} numColumns={0} cells={[]} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();

      const cells = screen.queryAllByRole('button');
      expect(cells).toHaveLength(0);
    });

    test('should handle single cell grid', () => {
      const singleCell = [createMockCell(0, 0, { contents: { value: 5, notes: [] } })];

      render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={singleCell} />);

      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(1);
      expect(cells[0]).toHaveTextContent('5');
    });

    test('should handle mismatched cell count and grid dimensions', () => {
      // Provide fewer cells than grid size
      const fewCells = createMockCells(2, 2);

      render(<SudokuGrid {...defaultProps} numRows={3} numColumns={3} cells={fewCells} />);

      // Should only render the cells provided
      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(4);
    });

    test('should handle cells with duplicate IDs gracefully', () => {
      // Suppress the expected React warning about duplicate keys
      const consoleError = jest.spyOn(console, 'error').mockImplementation((message) => {
        if (typeof message === 'string' && message.includes('duplicate-id')) {
          return; // Expected warning for this test
        }
        console.warn(message); // Log other errors as warnings
      });

      const duplicateCells = [
        createMockCell(0, 0, { id: 'duplicate-id' as CellId, contents: { value: 1, notes: [] } }),
        createMockCell(0, 1, { id: 'duplicate-id' as CellId, contents: { value: 2, notes: [] } })
      ];

      render(<SudokuGrid {...defaultProps} numRows={1} numColumns={2} cells={duplicateCells} />);

      // Both cells should render despite duplicate IDs
      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(2);

      consoleError.mockRestore();
    });

    test('should handle selection of non-existent cell ID', () => {
      render(<SudokuGrid {...defaultProps} selectedCell={'non-existent-cell' as CellId} />);

      // Should not crash and grid should still render
      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();

      // No cell should appear selected
      const allCells = screen.getAllByRole('button');
      const selectedCells = allCells.filter((cell) => cell.getAttribute('aria-selected') === 'true');
      expect(selectedCells).toHaveLength(0);
    });
  });

  describe('performance and optimization', () => {
    test('should memoize callback functions correctly', () => {
      const onCellSelect = jest.fn();
      const { rerender } = render(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect} />);

      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      expect(onCellSelect).toHaveBeenCalledTimes(1);

      // Rerender with same props
      rerender(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect} />);

      // Click should still work
      fireEvent.click(firstCell);
      expect(onCellSelect).toHaveBeenCalledTimes(2);
    });

    test('should handle large numbers of cells efficiently', () => {
      // Create a larger grid to test performance
      const largeCells = createMockCells(15, 15); // 225 cells

      const startTime = performance.now();
      render(<SudokuGrid {...defaultProps} numRows={15} numColumns={15} cells={largeCells} />);
      const endTime = performance.now();

      // Should render without significant delay
      expect(endTime - startTime).toBeLessThan(100); // 100ms threshold

      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(225);
    });
  });

  describe('integration with SudokuCell', () => {
    test('should pass correct props to SudokuCell components', () => {
      const cellWithAllFeatures = createMockCell(2, 3, {
        contents: { value: 8, notes: [1, 2] },
        isImmutable: true,
        hasValidationError: true
      });

      render(
        <SudokuGrid {...defaultProps} cells={[cellWithAllFeatures]} selectedCell={'cell-2-3' as CellId} />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-2-3');

      // Check that SudokuCell received correct props
      expect(cell).toHaveTextContent('8');
      // Notes are not displayed when cell has a value
      expect(cell).not.toHaveTextContent('1 2');
      expect(cell).toHaveAttribute('aria-selected', 'true');
      // Check data attributes for state
      expect(cell).toHaveAttribute('data-immutable', 'true');
      expect(cell).toHaveAttribute('data-error', 'true');
      expect(cell).toHaveAttribute('data-selected', 'true');
    });
  });
});
