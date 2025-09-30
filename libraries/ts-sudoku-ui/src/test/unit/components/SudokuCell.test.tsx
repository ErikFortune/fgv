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
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuCell } from '../../../components/SudokuCell';
import { ICellDisplayInfo } from '../../../types';
import { CellId } from '@fgv/ts-sudoku-lib';

describe('SudokuCell', () => {
  const createMockCellInfo = (overrides: Partial<ICellDisplayInfo> = {}): ICellDisplayInfo => ({
    id: 'cell-0-0' as CellId,
    row: 0,
    column: 0,
    contents: { value: undefined, notes: [] },
    isImmutable: false,
    hasValidationError: false,
    ...overrides
  });

  const defaultProps = {
    cellInfo: createMockCellInfo(),
    isSelected: false,
    inputMode: 'notes' as const,
    onSelect: jest.fn(),
    onValueChange: jest.fn(),
    onNoteToggle: jest.fn(),
    onClearAllNotes: jest.fn(),
    className: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('should render empty cell correctly', () => {
      render(<SudokuCell {...defaultProps} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveAttribute('data-row', '0');
      expect(cell).toHaveAttribute('data-column', '0');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, empty');
      expect(cell).toHaveAttribute('aria-selected', 'false');
      expect(cell.textContent).toBe('');
    });

    test('should render cell with value correctly', () => {
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithValue} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveTextContent('5');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, 5');
    });

    test('should render selected cell correctly', () => {
      render(<SudokuCell {...defaultProps} isSelected={true} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('aria-selected', 'true');
      expect(cell).toHaveAttribute('tabIndex', '0');
      expect(cell).toHaveAttribute('data-selected', 'true');
    });

    test('should render unselected cell correctly', () => {
      render(<SudokuCell {...defaultProps} isSelected={false} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('aria-selected', 'false');
      expect(cell).toHaveAttribute('tabIndex', '-1');
      expect(cell).toHaveAttribute('data-selected', 'false');
    });

    test('should render immutable cell correctly', () => {
      const immutableCell = createMockCellInfo({
        contents: { value: 7, notes: [] },
        isImmutable: true
      });

      render(<SudokuCell {...defaultProps} cellInfo={immutableCell} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('data-immutable', 'true');
      expect(cell).toHaveTextContent('7');
    });

    test('should render cell with validation error correctly', () => {
      const errorCell = createMockCellInfo({
        contents: { value: 3, notes: [] },
        hasValidationError: true
      });

      render(<SudokuCell {...defaultProps} cellInfo={errorCell} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('data-error', 'true');
    });

    test('should render cell with notes correctly', () => {
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} />);

      // Notes are rendered as individual elements in a 3x3 grid
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<SudokuCell {...defaultProps} className="custom-class" />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveClass('custom-class');
    });

    test('should apply filled data attribute when cell has value', () => {
      const filledCell = createMockCellInfo({
        contents: { value: 8, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={filledCell} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('data-filled', 'true');
    });
  });

  describe('section border styling', () => {
    test('should render cells at section boundaries', () => {
      // Test cell at column 2 (3x3 section boundary)
      const cellAtColumnBoundary = createMockCellInfo({
        id: 'cell-0-2' as CellId,
        column: 2
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellAtColumnBoundary} />);
      expect(screen.getByTestId('sudoku-cell-cell-0-2')).toBeInTheDocument();
    });

    test('should render cells at row boundaries', () => {
      // Test cell at row 2 (3x3 section boundary)
      const cellAtRowBoundary = createMockCellInfo({
        id: 'cell-2-0' as CellId,
        row: 2,
        column: 0
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellAtRowBoundary} />);
      expect(screen.getByTestId('sudoku-cell-cell-2-0')).toBeInTheDocument();
    });

    test('should render cells at grid edges', () => {
      // Test cell at column 8 (last column)
      const edgeCell = createMockCellInfo({
        id: 'cell-0-8' as CellId,
        column: 8
      });

      render(<SudokuCell {...defaultProps} cellInfo={edgeCell} />);
      expect(screen.getByTestId('sudoku-cell-cell-0-8')).toBeInTheDocument();
    });
  });

  describe('mouse interactions', () => {
    test('should call onSelect when clicked', () => {
      const onSelect = jest.fn();
      render(<SudokuCell {...defaultProps} onSelect={onSelect} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(cell);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    test('should call onSelect for immutable cells when clicked', () => {
      const immutableCell = createMockCellInfo({
        isImmutable: true
      });
      const onSelect = jest.fn();

      render(<SudokuCell {...defaultProps} cellInfo={immutableCell} onSelect={onSelect} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(cell);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard interactions', () => {
    test('should handle number input correctly in value mode', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(
        <SudokuCell {...defaultProps} inputMode="value" onValueChange={onValueChange} isSelected={true} />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('5');

      expect(onValueChange).toHaveBeenCalledWith(5);
    });

    test('should handle all valid number inputs (1-9) in value mode', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(
        <SudokuCell {...defaultProps} inputMode="value" onValueChange={onValueChange} isSelected={true} />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      for (let i = 1; i <= 9; i++) {
        await user.keyboard(i.toString());
        expect(onValueChange).toHaveBeenCalledWith(i);
      }

      expect(onValueChange).toHaveBeenCalledTimes(9);
    });

    test('should handle Delete key to clear cell value', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithValue}
          onValueChange={onValueChange}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Delete}');

      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });

    test('should handle Backspace key to clear cell value', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithValue}
          onValueChange={onValueChange}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Backspace}');

      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });

    test('should handle 0 key to clear cell value', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithValue}
          onValueChange={onValueChange}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('0');

      expect(onValueChange).toHaveBeenCalledWith(undefined);
    });

    test('should not handle input for immutable cells', async () => {
      const user = userEvent.setup();
      const immutableCell = createMockCellInfo({
        isImmutable: true
      });
      const onValueChange = jest.fn();

      render(<SudokuCell {...defaultProps} cellInfo={immutableCell} onValueChange={onValueChange} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('5');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    test('should not handle invalid keys', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(<SudokuCell {...defaultProps} onValueChange={onValueChange} isSelected={true} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('abc');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    test('should allow arrow keys to propagate for navigation', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();

      render(<SudokuCell {...defaultProps} onValueChange={onValueChange} isSelected={true} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      // Arrow keys should not trigger value change
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowRight}');

      expect(onValueChange).not.toHaveBeenCalled();
    });

    test('should prevent default for handled keys', () => {
      const onNoteToggle = jest.fn();
      render(<SudokuCell {...defaultProps} inputMode="notes" onNoteToggle={onNoteToggle} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');

      // Test number key in notes mode
      const numberEvent = new KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(numberEvent, 'preventDefault');
      fireEvent(cell, numberEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should prevent default for clear keys with value', () => {
      const onValueChange = jest.fn();
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });
      render(<SudokuCell {...defaultProps} cellInfo={cellWithValue} onValueChange={onValueChange} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');

      // Test Delete key with cell value
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(deleteEvent, 'preventDefault');
      fireEvent(cell, deleteEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<SudokuCell {...defaultProps} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell.tagName).toBe('BUTTON');
      expect(cell).toHaveAttribute('type', 'button');
      expect(cell).toHaveAttribute('aria-label');
      expect(cell).toHaveAttribute('aria-selected');
    });

    test('should have correct aria-label for different states', () => {
      const { rerender } = render(<SudokuCell {...defaultProps} />);

      let cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, empty');

      // Cell with value
      const cellWithValue = createMockCellInfo({
        contents: { value: 9, notes: [] }
      });
      act(() => {
        rerender(<SudokuCell {...defaultProps} cellInfo={cellWithValue} />);
      });

      cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, 9');
    });

    test('should have correct tabIndex based on selection', () => {
      const { rerender } = render(<SudokuCell {...defaultProps} isSelected={false} />);

      let cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('tabIndex', '-1');

      act(() => {
        rerender(<SudokuCell {...defaultProps} isSelected={true} />);
      });

      cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('tabIndex', '0');
    });

    test('should be keyboard accessible', () => {
      render(<SudokuCell {...defaultProps} isSelected={true} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('tabIndex', '0');

      cell.focus();
      expect(document.activeElement).toBe(cell);
    });
  });

  describe('visual styling', () => {
    test('should apply correct data attributes based on state', () => {
      const cellInfo = createMockCellInfo({
        contents: { value: 4, notes: [] },
        isImmutable: true,
        hasValidationError: true
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellInfo} isSelected={true} className="custom-class" />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('data-selected', 'true');
      expect(cell).toHaveAttribute('data-error', 'true');
      expect(cell).toHaveAttribute('data-immutable', 'true');
      expect(cell).toHaveAttribute('data-filled', 'true');
      expect(cell).toHaveClass('custom-class');
    });

    test('should render value correctly', () => {
      const cellWithValue = createMockCellInfo({
        contents: { value: 6, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithValue} />);

      expect(screen.getByText('6')).toBeInTheDocument();
    });

    test('should render notes correctly', () => {
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 4, 7] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} />);

      // Notes are rendered as individual elements
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    test('should not render notes when notes array is empty', () => {
      const cellWithoutNotes = createMockCellInfo({
        contents: { value: 2, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithoutNotes} />);

      // When there's a value, notes should not be rendered
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  describe('component updates', () => {
    test('should update when cellInfo changes', () => {
      const initialCellInfo = createMockCellInfo({
        contents: { value: 1, notes: [] }
      });

      const { rerender } = render(<SudokuCell {...defaultProps} cellInfo={initialCellInfo} />);

      expect(screen.getByText('1')).toBeInTheDocument();

      const updatedCellInfo = createMockCellInfo({
        contents: { value: 9, notes: [] }
      });

      act(() => {
        rerender(<SudokuCell {...defaultProps} cellInfo={updatedCellInfo} />);
      });

      expect(screen.getByText('9')).toBeInTheDocument();
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    test('should update when selection state changes', () => {
      const { rerender } = render(<SudokuCell {...defaultProps} isSelected={false} />);

      let cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('data-selected', 'false');

      act(() => {
        rerender(<SudokuCell {...defaultProps} isSelected={true} />);
      });

      cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('edge cases', () => {
    test('should handle cell with position at grid boundaries', () => {
      const boundaryCell = createMockCellInfo({
        id: 'cell-8-8' as CellId,
        row: 8,
        column: 8
      });

      render(<SudokuCell {...defaultProps} cellInfo={boundaryCell} />);

      const cell = screen.getByTestId('sudoku-cell-cell-8-8');
      expect(cell).toHaveAttribute('data-row', '8');
      expect(cell).toHaveAttribute('data-column', '8');
      expect(cell).toHaveAttribute('aria-label', 'Row 9, Column 9, empty');
    });

    test('should handle cell with large notes array', () => {
      const cellWithManyNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithManyNotes} />);

      // All notes should be rendered as individual elements
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((note) => {
        expect(screen.getByText(note.toString())).toBeInTheDocument();
      });
    });

    test('should handle cell with single note', () => {
      const cellWithSingleNote = createMockCellInfo({
        contents: { value: undefined, notes: [5] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithSingleNote} />);

      const notesElement = screen.getByText('5');
      expect(notesElement).toBeInTheDocument();
    });
  });
});
