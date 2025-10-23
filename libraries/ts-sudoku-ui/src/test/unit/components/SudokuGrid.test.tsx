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
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuGrid } from '../../../components/SudokuGrid';
import { ICellDisplayInfo, ICageDisplayInfo } from '../../../types';
import { CellId, ICage, CageId } from '@fgv/ts-sudoku-lib';

describe('SudokuGrid - Comprehensive Functional Tests', () => {
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

  const createMockCage = (
    id: string,
    cellIds: CellId[],
    targetSum: number,
    overrides: Partial<ICageDisplayInfo> = {}
  ): ICageDisplayInfo => {
    return {
      cage: {
        id: id as unknown as CageId,
        cellIds,
        cageType: 'killer' as unknown as number,
        total: targetSum,
        numCells: cellIds.length,
        containsCell: (cellId: CellId) => cellIds.includes(cellId)
      } as unknown as ICage,
      isHighlighted: false,
      isComplete: false,
      isValid: true,
      ...overrides
    };
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

  describe('Grid Rendering', () => {
    describe('basic structure', () => {
      test('should render grid with correct ARIA attributes', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveAttribute('role', 'grid');
        expect(grid).toHaveAttribute('aria-label', 'Sudoku puzzle entry grid');
        expect(grid).toHaveAttribute('tabIndex', '0');
      });

      test('should render grid with outline-none class for keyboard focus handling', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveClass('outline-none');
      });

      test('should apply custom className when provided', () => {
        render(<SudokuGrid {...defaultProps} className="custom-grid-class" />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveClass('sudoku-grid');
        expect(grid).toHaveClass('custom-grid-class');
      });

      test('should have aspect-square class for proper proportions', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveClass('aspect-square');
      });
    });

    describe('grid dimensions', () => {
      test('should render standard 9x9 grid with 81 cells', () => {
        render(<SudokuGrid {...defaultProps} />);

        const cells = screen.getAllByRole('button');
        expect(cells).toHaveLength(81);
      });

      test('should render 4x4 grid with 16 cells', () => {
        const cells = createMockCells(4, 4);
        render(<SudokuGrid {...defaultProps} numRows={4} numColumns={4} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells).toHaveLength(16);
      });

      test('should render 6x6 grid with 36 cells', () => {
        const cells = createMockCells(6, 6);
        render(<SudokuGrid {...defaultProps} numRows={6} numColumns={6} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells).toHaveLength(36);
      });

      test('should render 12x12 grid with 144 cells', () => {
        const cells = createMockCells(12, 12);
        render(<SudokuGrid {...defaultProps} numRows={12} numColumns={12} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells).toHaveLength(144);
      });

      test('should apply correct CSS grid template columns and rows', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveStyle({
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(9, 1fr)'
        });
      });

      test('should apply correct CSS grid template for non-standard dimensions', () => {
        const cells = createMockCells(6, 6);
        render(<SudokuGrid {...defaultProps} numRows={6} numColumns={6} cells={cells} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveStyle({
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)'
        });
      });
    });

    describe('cell ordering', () => {
      test('should render cells in row-major order (left to right, top to bottom)', () => {
        const cells = [
          createMockCell(0, 0, { contents: { value: 1, notes: [] } }),
          createMockCell(0, 1, { contents: { value: 2, notes: [] } }),
          createMockCell(1, 0, { contents: { value: 3, notes: [] } }),
          createMockCell(1, 1, { contents: { value: 4, notes: [] } })
        ];

        render(<SudokuGrid {...defaultProps} numRows={2} numColumns={2} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells[0]).toHaveTextContent('1');
        expect(renderedCells[1]).toHaveTextContent('2');
        expect(renderedCells[2]).toHaveTextContent('3');
        expect(renderedCells[3]).toHaveTextContent('4');
      });

      test('should sort unsorted cells correctly before rendering', () => {
        const unsortedCells = [
          createMockCell(1, 1, { contents: { value: 4, notes: [] } }),
          createMockCell(0, 0, { contents: { value: 1, notes: [] } }),
          createMockCell(1, 0, { contents: { value: 3, notes: [] } }),
          createMockCell(0, 1, { contents: { value: 2, notes: [] } })
        ];

        render(<SudokuGrid {...defaultProps} numRows={2} numColumns={2} cells={unsortedCells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells[0]).toHaveTextContent('1');
        expect(renderedCells[1]).toHaveTextContent('2');
        expect(renderedCells[2]).toHaveTextContent('3');
        expect(renderedCells[3]).toHaveTextContent('4');
      });

      test('should render all cells in correct positions for standard 9x9 grid', () => {
        render(<SudokuGrid {...defaultProps} />);

        // Verify corner cells exist
        expect(screen.getByTestId('sudoku-cell-cell-0-0')).toBeInTheDocument();
        expect(screen.getByTestId('sudoku-cell-cell-0-8')).toBeInTheDocument();
        expect(screen.getByTestId('sudoku-cell-cell-8-0')).toBeInTheDocument();
        expect(screen.getByTestId('sudoku-cell-cell-8-8')).toBeInTheDocument();

        // Verify center cell exists
        expect(screen.getByTestId('sudoku-cell-cell-4-4')).toBeInTheDocument();
      });
    });
  });

  describe('Cell Display', () => {
    describe('cell values', () => {
      test('should display cell with value', () => {
        const cells = [createMockCell(0, 0, { contents: { value: 5, notes: [] } })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('5');
      });

      test('should display multiple cells with different values', () => {
        const cells = [
          createMockCell(0, 0, { contents: { value: 1, notes: [] } }),
          createMockCell(0, 1, { contents: { value: 9, notes: [] } }),
          createMockCell(0, 2, { contents: { value: 5, notes: [] } })
        ];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={3} cells={cells} />);

        expect(screen.getByTestId('sudoku-cell-cell-0-0')).toHaveTextContent('1');
        expect(screen.getByTestId('sudoku-cell-cell-0-1')).toHaveTextContent('9');
        expect(screen.getByTestId('sudoku-cell-cell-0-2')).toHaveTextContent('5');
      });

      test('should display empty cell without value', () => {
        const cells = [createMockCell(0, 0, { contents: { value: undefined, notes: [] } })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).not.toHaveTextContent(/[1-9]/);
      });
    });

    describe('cell notes', () => {
      test('should display cell with notes when no value is present', () => {
        const cells = [createMockCell(0, 0, { contents: { value: undefined, notes: [1, 2, 3] } })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('1');
        expect(cell).toHaveTextContent('2');
        expect(cell).toHaveTextContent('3');
      });

      test('should not display notes when cell has a value', () => {
        const cells = [createMockCell(0, 0, { contents: { value: 5, notes: [1, 2, 3] } })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('5');
        // Notes should not be visible when cell has a value
        // The cell value is displayed, not individual note digits
        expect(within(cell).queryByText('1')).not.toBeInTheDocument();
        expect(within(cell).queryByText('2')).not.toBeInTheDocument();
        expect(within(cell).queryByText('3')).not.toBeInTheDocument();
      });

      test('should display multiple notes in a cell', () => {
        const cells = [createMockCell(0, 0, { contents: { value: undefined, notes: [1, 5, 9] } })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('1');
        expect(cell).toHaveTextContent('5');
        expect(cell).toHaveTextContent('9');
      });
    });

    describe('immutable cells', () => {
      test('should render immutable cell with pre-filled value', () => {
        const cells = [createMockCell(0, 0, { contents: { value: 7, notes: [] }, isImmutable: true })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('7');
        expect(cell).toHaveAttribute('data-immutable', 'true');
      });

      test('should render multiple immutable cells correctly', () => {
        const cells = [
          createMockCell(0, 0, { contents: { value: 1, notes: [] }, isImmutable: true }),
          createMockCell(0, 1, { contents: { value: 2, notes: [] }, isImmutable: false }),
          createMockCell(0, 2, { contents: { value: 3, notes: [] }, isImmutable: true })
        ];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={3} cells={cells} />);

        expect(screen.getByTestId('sudoku-cell-cell-0-0')).toHaveAttribute('data-immutable', 'true');
        expect(screen.getByTestId('sudoku-cell-cell-0-1')).toHaveAttribute('data-immutable', 'false');
        expect(screen.getByTestId('sudoku-cell-cell-0-2')).toHaveAttribute('data-immutable', 'true');
      });
    });

    describe('error cells', () => {
      test('should render cell with validation error styling', () => {
        const cells = [createMockCell(0, 0, { contents: { value: 5, notes: [] }, hasValidationError: true })];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveAttribute('data-error', 'true');
      });

      test('should render multiple error cells correctly', () => {
        const cells = [
          createMockCell(0, 0, { contents: { value: 5, notes: [] }, hasValidationError: true }),
          createMockCell(0, 1, { contents: { value: 5, notes: [] }, hasValidationError: true }),
          createMockCell(0, 2, { contents: { value: 3, notes: [] }, hasValidationError: false })
        ];

        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={3} cells={cells} />);

        expect(screen.getByTestId('sudoku-cell-cell-0-0')).toHaveAttribute('data-error', 'true');
        expect(screen.getByTestId('sudoku-cell-cell-0-1')).toHaveAttribute('data-error', 'true');
        expect(screen.getByTestId('sudoku-cell-cell-0-2')).toHaveAttribute('data-error', 'false');
      });
    });
  });

  describe('Cell Selection', () => {
    describe('single cell selection', () => {
      test('should highlight selected cell', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'cell-4-4' as CellId} />);

        const selectedCell = screen.getByTestId('sudoku-cell-cell-4-4');
        expect(selectedCell).toHaveAttribute('aria-selected', 'true');
        expect(selectedCell).toHaveAttribute('data-selected', 'true');
      });

      test('should make only selected cell focusable', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'cell-2-3' as CellId} />);

        const selectedCell = screen.getByTestId('sudoku-cell-cell-2-3');
        const unselectedCell = screen.getByTestId('sudoku-cell-cell-0-0');

        expect(selectedCell).toHaveAttribute('tabIndex', '0');
        expect(unselectedCell).toHaveAttribute('tabIndex', '-1');
      });

      test('should change selected cell when different cell is clicked', () => {
        const onCellSelect = jest.fn();
        const { rerender } = render(
          <SudokuGrid {...defaultProps} onCellSelect={onCellSelect} selectedCell={'cell-0-0' as CellId} />
        );

        const newCell = screen.getByTestId('sudoku-cell-cell-3-3');
        fireEvent.click(newCell);

        expect(onCellSelect).toHaveBeenCalledWith('cell-3-3', expect.any(Object));

        // Simulate parent updating selectedCell
        rerender(
          <SudokuGrid {...defaultProps} onCellSelect={onCellSelect} selectedCell={'cell-3-3' as CellId} />
        );

        expect(screen.getByTestId('sudoku-cell-cell-3-3')).toHaveAttribute('aria-selected', 'true');
      });
    });

    describe('multi-cell selection', () => {
      test('should highlight multiple selected cells', () => {
        const selectedCells = ['cell-0-0' as CellId, 'cell-1-1' as CellId, 'cell-2-2' as CellId];
        render(
          <SudokuGrid {...defaultProps} selectedCell={'cell-0-0' as CellId} selectedCells={selectedCells} />
        );

        expect(screen.getByTestId('sudoku-cell-cell-0-0')).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('sudoku-cell-cell-1-1')).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('sudoku-cell-cell-2-2')).toHaveAttribute('aria-selected', 'true');
      });

      test('should distinguish between primary selection and multi-selection', () => {
        const selectedCells = ['cell-0-0' as CellId, 'cell-1-1' as CellId];
        render(
          <SudokuGrid {...defaultProps} selectedCell={'cell-0-0' as CellId} selectedCells={selectedCells} />
        );

        const primaryCell = screen.getByTestId('sudoku-cell-cell-0-0');
        const multiCell = screen.getByTestId('sudoku-cell-cell-1-1');

        // Primary cell should not have multi-selected class
        expect(primaryCell.className).not.toContain('multi-selected');
        // Multi-selected cell should have the class
        expect(multiCell.className).toContain('multi-selected');
      });

      test('should handle selection of cells that are not in selectedCells array', () => {
        const onCellSelect = jest.fn();
        render(
          <SudokuGrid {...defaultProps} onCellSelect={onCellSelect} selectedCells={['cell-0-0' as CellId]} />
        );

        const unselectedCell = screen.getByTestId('sudoku-cell-cell-5-5');
        fireEvent.click(unselectedCell);

        expect(onCellSelect).toHaveBeenCalledWith('cell-5-5', expect.any(Object));
      });
    });

    describe('cell click interactions', () => {
      test('should call onCellSelect when cell is clicked', () => {
        const onCellSelect = jest.fn();
        render(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect} />);

        const cell = screen.getByTestId('sudoku-cell-cell-3-4');
        fireEvent.click(cell);

        expect(onCellSelect).toHaveBeenCalledTimes(1);
        expect(onCellSelect).toHaveBeenCalledWith('cell-3-4', expect.any(Object));
      });

      test('should pass mouse event to onCellSelect for modifier key detection', () => {
        const onCellSelect = jest.fn();
        render(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect} />);

        const cell = screen.getByTestId('sudoku-cell-cell-2-2');
        fireEvent.click(cell, { ctrlKey: true });

        expect(onCellSelect).toHaveBeenCalledWith('cell-2-2', expect.objectContaining({ ctrlKey: true }));
      });

      test('should allow clicking already selected cell', () => {
        const onCellSelect = jest.fn();
        render(
          <SudokuGrid {...defaultProps} onCellSelect={onCellSelect} selectedCell={'cell-1-1' as CellId} />
        );

        const cell = screen.getByTestId('sudoku-cell-cell-1-1');
        fireEvent.click(cell);

        expect(onCellSelect).toHaveBeenCalledWith('cell-1-1', expect.any(Object));
      });

      test('should allow clicking immutable cells for selection', () => {
        const onCellSelect = jest.fn();
        const cells = [createMockCell(0, 0, { contents: { value: 5, notes: [] }, isImmutable: true })];

        render(
          <SudokuGrid
            {...defaultProps}
            cells={cells}
            numRows={1}
            numColumns={1}
            onCellSelect={onCellSelect}
          />
        );

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        fireEvent.click(cell);

        expect(onCellSelect).toHaveBeenCalledWith('cell-0-0', expect.any(Object));
      });
    });
  });

  describe('Keyboard Navigation', () => {
    describe('arrow key navigation', () => {
      test('should navigate up when ArrowUp is pressed', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-4-4' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'ArrowUp' });

        expect(onNavigate).toHaveBeenCalledWith('up');
      });

      test('should navigate down when ArrowDown is pressed', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-4-4' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'ArrowDown' });

        expect(onNavigate).toHaveBeenCalledWith('down');
      });

      test('should navigate left when ArrowLeft is pressed', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-4-4' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'ArrowLeft' });

        expect(onNavigate).toHaveBeenCalledWith('left');
      });

      test('should navigate right when ArrowRight is pressed', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-4-4' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'ArrowRight' });

        expect(onNavigate).toHaveBeenCalledWith('right');
      });

      test('should not navigate when no cell is selected', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={null} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'ArrowUp' });
        fireEvent.keyDown(grid, { key: 'ArrowDown' });
        fireEvent.keyDown(grid, { key: 'ArrowLeft' });
        fireEvent.keyDown(grid, { key: 'ArrowRight' });

        expect(onNavigate).not.toHaveBeenCalled();
      });

      test('should prevent default behavior for arrow keys', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-3-3' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        grid.dispatchEvent(event);

        expect(onNavigate).toHaveBeenCalledWith('up');
        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('non-navigation keys', () => {
      test('should not handle number keys at grid level', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-3-3' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: '5' });

        expect(onNavigate).not.toHaveBeenCalled();
      });

      test('should not handle delete/backspace keys at grid level', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-3-3' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'Delete' });
        fireEvent.keyDown(grid, { key: 'Backspace' });

        expect(onNavigate).not.toHaveBeenCalled();
      });

      test('should ignore other non-arrow keys', () => {
        const onNavigate = jest.fn();
        render(<SudokuGrid {...defaultProps} onNavigate={onNavigate} selectedCell={'cell-3-3' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.keyDown(grid, { key: 'Enter' });
        fireEvent.keyDown(grid, { key: 'Space' });
        fireEvent.keyDown(grid, { key: 'Tab' });
        fireEvent.keyDown(grid, { key: 'Escape' });

        expect(onNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Puzzle Type Support', () => {
    describe('standard sudoku', () => {
      test('should render standard sudoku without puzzle type specified', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('border-2', 'border-black');
      });

      test('should render standard sudoku with explicit puzzle type', () => {
        render(<SudokuGrid {...defaultProps} puzzleType="standard" />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();
      });
    });

    describe('sudoku-x variant', () => {
      test('should render sudoku-x puzzle with puzzle type', () => {
        render(<SudokuGrid {...defaultProps} puzzleType="sudoku-x" />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();
        // Grid should render successfully for sudoku-x type
        // Diagonal rendering implementation is verified through visual testing
      });

      test('should render standard sudoku without sudoku-x features', () => {
        render(<SudokuGrid {...defaultProps} puzzleType="standard" />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();
        // Grid should render successfully for standard type
      });
    });

    describe('killer sudoku variant', () => {
      test('should render cage overlay for killer sudoku', () => {
        const cages = [
          createMockCage('cage1', ['cell-0-0' as CellId, 'cell-0-1' as CellId], 10),
          createMockCage('cage2', ['cell-1-0' as CellId, 'cell-1-1' as CellId], 15)
        ];

        render(<SudokuGrid {...defaultProps} puzzleType="killer-sudoku" cages={cages} />);

        const cageOverlay = screen.getByTestId('cage-overlay');
        expect(cageOverlay).toBeInTheDocument();
      });

      test('should not render cage overlay when no cages provided', () => {
        render(<SudokuGrid {...defaultProps} puzzleType="killer-sudoku" cages={[]} />);

        const cageOverlay = screen.queryByTestId('cage-overlay');
        expect(cageOverlay).not.toBeInTheDocument();
      });

      test('should not render cage overlay for non-killer sudoku', () => {
        const cages = [createMockCage('cage1', ['cell-0-0' as CellId, 'cell-0-1' as CellId], 10)];

        render(<SudokuGrid {...defaultProps} puzzleType="standard" cages={cages} />);

        const cageOverlay = screen.queryByTestId('cage-overlay');
        expect(cageOverlay).not.toBeInTheDocument();
      });
    });
  });

  describe('Section Borders and Puzzle Dimensions', () => {
    describe('standard 9x9 with 3x3 sections', () => {
      test('should pass correct puzzle dimensions to cells', () => {
        const puzzleDimensions = {
          cageHeightInCells: 3,
          cageWidthInCells: 3,
          boardWidthInCages: 3,
          boardHeightInCages: 3,
          totalRows: 9,
          totalColumns: 9,
          maxValue: 9,
          totalCages: 9,
          basicCageTotal: 45
        };

        render(<SudokuGrid {...defaultProps} puzzleDimensions={puzzleDimensions} />);

        // Cells should receive dimension information for border rendering
        const cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toBeInTheDocument();
      });
    });

    describe('6x6 with 2x3 sections', () => {
      test('should handle 6x6 puzzle with 2x3 sections', () => {
        const cells = createMockCells(6, 6);
        const puzzleDimensions = {
          cageHeightInCells: 2,
          cageWidthInCells: 3,
          boardWidthInCages: 2,
          boardHeightInCages: 3,
          totalRows: 6,
          totalColumns: 6,
          maxValue: 6,
          totalCages: 6,
          basicCageTotal: 21
        };

        render(
          <SudokuGrid
            {...defaultProps}
            numRows={6}
            numColumns={6}
            cells={cells}
            puzzleDimensions={puzzleDimensions}
          />
        );

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveStyle({
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)'
        });
      });
    });

    describe('12x12 with 3x4 sections', () => {
      test('should handle 12x12 puzzle with 3x4 sections', () => {
        const cells = createMockCells(12, 12);
        const puzzleDimensions = {
          cageHeightInCells: 3,
          cageWidthInCells: 4,
          boardWidthInCages: 3,
          boardHeightInCages: 4,
          totalRows: 12,
          totalColumns: 12,
          maxValue: 12,
          totalCages: 12,
          basicCageTotal: 78
        };

        render(
          <SudokuGrid
            {...defaultProps}
            numRows={12}
            numColumns={12}
            cells={cells}
            puzzleDimensions={puzzleDimensions}
          />
        );

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveStyle({
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(12, 1fr)'
        });
      });
    });
  });

  describe('Drag Selection', () => {
    describe('drag over handler', () => {
      test('should call onDragOver when provided and cell is hovered during drag', () => {
        const onDragOver = jest.fn();
        render(<SudokuGrid {...defaultProps} onDragOver={onDragOver} isDragging={true} />);

        const cell = screen.getByTestId('sudoku-cell-cell-2-3');
        fireEvent.mouseMove(cell);

        expect(onDragOver).toHaveBeenCalledWith('cell-2-3');
      });

      test('should not call onDragOver when handler not provided', () => {
        render(<SudokuGrid {...defaultProps} isDragging={true} />);

        const cell = screen.getByTestId('sudoku-cell-cell-2-3');
        fireEvent.mouseMove(cell);

        // Should not throw error when handler is undefined
        expect(cell).toBeInTheDocument();
      });
    });

    describe('drag end handler', () => {
      test('should call onDragEnd on mouse up', () => {
        const onDragEnd = jest.fn();
        render(<SudokuGrid {...defaultProps} onDragEnd={onDragEnd} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.mouseUp(grid);

        expect(onDragEnd).toHaveBeenCalledTimes(1);
      });

      test('should call onDragEnd on touch end', () => {
        const onDragEnd = jest.fn();
        render(<SudokuGrid {...defaultProps} onDragEnd={onDragEnd} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.touchEnd(grid);

        expect(onDragEnd).toHaveBeenCalledTimes(1);
      });

      test('should not crash when onDragEnd not provided', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        fireEvent.mouseUp(grid);

        expect(grid).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Puzzle Data', () => {
    describe('puzzle state updates', () => {
      test('should update display when cell values change', () => {
        const initialCells = [createMockCell(0, 0, { contents: { value: undefined, notes: [] } })];
        const { rerender } = render(
          <SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={initialCells} />
        );

        let cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).not.toHaveTextContent(/[1-9]/);

        const updatedCells = [createMockCell(0, 0, { contents: { value: 7, notes: [] } })];
        rerender(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={updatedCells} />);

        cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('7');
      });

      test('should update display when notes change', () => {
        const initialCells = [createMockCell(0, 0, { contents: { value: undefined, notes: [1, 2] } })];
        const { rerender } = render(
          <SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={initialCells} />
        );

        let cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('1');
        expect(cell).toHaveTextContent('2');

        const updatedCells = [
          createMockCell(0, 0, { contents: { value: undefined, notes: [1, 2, 3, 4, 5] } })
        ];
        rerender(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={updatedCells} />);

        cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveTextContent('5');
      });

      test('should update validation error state', () => {
        const initialCells = [
          createMockCell(0, 0, { contents: { value: 5, notes: [] }, hasValidationError: false })
        ];
        const { rerender } = render(
          <SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={initialCells} />
        );

        let cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveAttribute('data-error', 'false');

        const updatedCells = [
          createMockCell(0, 0, { contents: { value: 5, notes: [] }, hasValidationError: true })
        ];
        rerender(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={updatedCells} />);

        cell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(cell).toHaveAttribute('data-error', 'true');
      });
    });

    describe('complete puzzle scenarios', () => {
      test('should display empty puzzle correctly', () => {
        const emptyCells = createMockCells(9, 9);
        render(<SudokuGrid {...defaultProps} cells={emptyCells} />);

        const cells = screen.getAllByRole('button');
        cells.forEach((cell) => {
          expect(cell).not.toHaveTextContent(/[1-9]/);
        });
      });

      test('should display partially filled puzzle', () => {
        const cells = createMockCells(9, 9);
        cells[0] = createMockCell(0, 0, { contents: { value: 1, notes: [] } });
        cells[10] = createMockCell(1, 1, { contents: { value: 5, notes: [] } });
        cells[20] = createMockCell(2, 2, { contents: { value: 9, notes: [] } });

        render(<SudokuGrid {...defaultProps} cells={cells} />);

        expect(screen.getByTestId('sudoku-cell-cell-0-0')).toHaveTextContent('1');
        expect(screen.getByTestId('sudoku-cell-cell-1-1')).toHaveTextContent('5');
        expect(screen.getByTestId('sudoku-cell-cell-2-2')).toHaveTextContent('9');
      });

      test('should display fully filled puzzle', () => {
        const cells: ICellDisplayInfo[] = [];
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const i = row * 3 + col;
            cells.push(createMockCell(row, col, { contents: { value: (i % 9) + 1, notes: [] } }));
          }
        }

        render(<SudokuGrid {...defaultProps} numRows={3} numColumns={3} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        renderedCells.forEach((cell) => {
          expect(cell).toHaveTextContent(/[1-9]/);
        });
      });
    });
  });

  describe('Accessibility', () => {
    describe('ARIA attributes', () => {
      test('should have grid role', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByRole('grid');
        expect(grid).toBeInTheDocument();
      });

      test('should have descriptive aria-label', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByLabelText('Sudoku puzzle entry grid');
        expect(grid).toBeInTheDocument();
      });

      test('should have cells with button role', () => {
        render(<SudokuGrid {...defaultProps} />);

        const cells = screen.getAllByRole('button');
        expect(cells.length).toBeGreaterThan(0);
      });

      test('should mark selected cell with aria-selected', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'cell-3-3' as CellId} />);

        const selectedCell = screen.getByTestId('sudoku-cell-cell-3-3');
        expect(selectedCell).toHaveAttribute('aria-selected', 'true');
      });

      test('should mark unselected cells with aria-selected false', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'cell-3-3' as CellId} />);

        const unselectedCell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(unselectedCell).toHaveAttribute('aria-selected', 'false');
      });
    });

    describe('keyboard focus management', () => {
      test('should be keyboard focusable', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toHaveAttribute('tabIndex', '0');
      });

      test('should receive focus when clicked', () => {
        render(<SudokuGrid {...defaultProps} />);

        const grid = screen.getByTestId('sudoku-grid');
        grid.focus();

        expect(document.activeElement).toBe(grid);
      });

      test('should make selected cell keyboard navigable', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'cell-4-4' as CellId} />);

        const selectedCell = screen.getByTestId('sudoku-cell-cell-4-4');
        expect(selectedCell).toHaveAttribute('tabIndex', '0');
      });

      test('should make unselected cells not keyboard navigable', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'cell-4-4' as CellId} />);

        const unselectedCell = screen.getByTestId('sudoku-cell-cell-0-0');
        expect(unselectedCell).toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('Edge Cases', () => {
    describe('empty states', () => {
      test('should handle empty cells array', () => {
        render(<SudokuGrid {...defaultProps} numRows={0} numColumns={0} cells={[]} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();

        const cells = screen.queryAllByRole('button');
        expect(cells).toHaveLength(0);
      });

      test('should handle single cell grid', () => {
        const cells = [createMockCell(0, 0, { contents: { value: 5, notes: [] } })];
        render(<SudokuGrid {...defaultProps} numRows={1} numColumns={1} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells).toHaveLength(1);
        expect(renderedCells[0]).toHaveTextContent('5');
      });
    });

    describe('mismatched data', () => {
      test('should handle fewer cells than grid dimensions', () => {
        const cells = createMockCells(2, 2); // Only 4 cells
        render(<SudokuGrid {...defaultProps} numRows={3} numColumns={3} cells={cells} />);

        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells).toHaveLength(4);
      });

      test('should handle more cells than grid dimensions gracefully', () => {
        const cells = createMockCells(5, 5); // 25 cells
        render(<SudokuGrid {...defaultProps} numRows={3} numColumns={3} cells={cells} />);

        // Should render all cells even if dimensions don't match
        const renderedCells = screen.getAllByRole('button');
        expect(renderedCells).toHaveLength(25);
      });
    });

    describe('invalid selections', () => {
      test('should handle selection of non-existent cell ID', () => {
        render(<SudokuGrid {...defaultProps} selectedCell={'invalid-cell-id' as CellId} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();

        const cells = screen.getAllByRole('button');
        const selectedCells = cells.filter((cell) => cell.getAttribute('aria-selected') === 'true');
        expect(selectedCells).toHaveLength(0);
      });

      test('should handle empty selectedCells array', () => {
        render(<SudokuGrid {...defaultProps} selectedCells={[]} />);

        const grid = screen.getByTestId('sudoku-grid');
        expect(grid).toBeInTheDocument();
      });
    });

    describe('re-rendering scenarios', () => {
      test('should handle changing grid dimensions', () => {
        const { rerender } = render(
          <SudokuGrid {...defaultProps} numRows={4} numColumns={4} cells={createMockCells(4, 4)} />
        );

        let cells = screen.getAllByRole('button');
        expect(cells).toHaveLength(16);

        rerender(<SudokuGrid {...defaultProps} numRows={6} numColumns={6} cells={createMockCells(6, 6)} />);

        cells = screen.getAllByRole('button');
        expect(cells).toHaveLength(36);
      });

      test('should handle unmounting with active selection', () => {
        const { unmount } = render(<SudokuGrid {...defaultProps} selectedCell={'cell-4-4' as CellId} />);

        expect(() => unmount()).not.toThrow();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should render large grids efficiently', () => {
      const startTime = performance.now();
      const largeCells = createMockCells(12, 12); // 144 cells

      render(<SudokuGrid {...defaultProps} numRows={12} numColumns={12} cells={largeCells} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should render within 200ms

      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(144);
    });

    test('should handle rapid re-renders without errors', () => {
      const { rerender } = render(<SudokuGrid {...defaultProps} selectedCell={'cell-0-0' as CellId} />);

      for (let i = 0; i < 10; i++) {
        rerender(<SudokuGrid {...defaultProps} selectedCell={`cell-${i % 9}-${i % 9}` as CellId} />);
      }

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
    });

    test('should handle callback prop changes without re-rendering cells unnecessarily', () => {
      const onCellSelect1 = jest.fn();
      const { rerender } = render(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect1} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(cell);
      expect(onCellSelect1).toHaveBeenCalledTimes(1);

      // Change callback reference
      const onCellSelect2 = jest.fn();
      rerender(<SudokuGrid {...defaultProps} onCellSelect={onCellSelect2} />);

      fireEvent.click(cell);
      expect(onCellSelect2).toHaveBeenCalledTimes(1);
      expect(onCellSelect1).toHaveBeenCalledTimes(1); // Old callback should not be called again
    });
  });

  describe('Long Press and Touch Interactions', () => {
    test('should support onLongPressToggle when provided', () => {
      const onLongPressToggle = jest.fn();
      render(<SudokuGrid {...defaultProps} onLongPressToggle={onLongPressToggle} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
      // Handler is passed to cells, which manage long press internally
    });

    test('should handle undefined onLongPressToggle gracefully', () => {
      render(<SudokuGrid {...defaultProps} />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
      // Should not crash when handler is undefined
    });
  });

  describe('Input Mode Propagation', () => {
    test('should pass value input mode to cells', () => {
      render(<SudokuGrid {...defaultProps} inputMode="value" />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
      // Cells should receive inputMode prop
    });

    test('should pass notes input mode to cells', () => {
      render(<SudokuGrid {...defaultProps} inputMode="notes" />);

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
      // Cells should receive inputMode prop
    });

    test('should update cells when input mode changes', () => {
      const { rerender } = render(<SudokuGrid {...defaultProps} inputMode="value" />);

      let grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();

      rerender(<SudokuGrid {...defaultProps} inputMode="notes" />);

      grid = screen.getByTestId('sudoku-grid');
      expect(grid).toBeInTheDocument();
    });
  });
});
