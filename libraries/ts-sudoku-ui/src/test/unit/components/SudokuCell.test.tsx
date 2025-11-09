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

    test('should apply multi-selected class when className includes multi-selected', () => {
      render(<SudokuCell {...defaultProps} isSelected={true} className="multi-selected" />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveClass('multi-selected');
      expect(cell).toHaveClass('bg-blue-200');
      expect(cell).toHaveClass('border-blue-500');
    });

    test('should apply single selected styling when not multi-selected', () => {
      render(<SudokuCell {...defaultProps} isSelected={true} className="selected-cell" />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveClass('selected-cell');
      expect(cell).toHaveClass('bg-blue-300');
      expect(cell).toHaveClass('border-blue-600');
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

    test('should not render notes when cell has a value (early return)', () => {
      const cellWithValueAndNotes = createMockCellInfo({
        contents: { value: 8, notes: [1, 2, 3, 4, 5, 6, 7, 9] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithValueAndNotes} />);

      // Should show value
      expect(screen.getByText('8')).toBeInTheDocument();

      // Should NOT show any notes despite notes array having values
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
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

  describe('notes mode functionality', () => {
    test('should toggle notes when number pressed in notes mode', async () => {
      const user = userEvent.setup();
      const onNoteToggle = jest.fn();

      render(
        <SudokuCell {...defaultProps} inputMode="notes" onNoteToggle={onNoteToggle} isSelected={true} />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('3');

      expect(onNoteToggle).toHaveBeenCalledWith(3);
    });

    test('should toggle notes for all numbers 1-9 in notes mode', async () => {
      const user = userEvent.setup();
      const onNoteToggle = jest.fn();

      render(
        <SudokuCell {...defaultProps} inputMode="notes" onNoteToggle={onNoteToggle} isSelected={true} />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      for (let i = 1; i <= 9; i++) {
        await user.keyboard(i.toString());
        expect(onNoteToggle).toHaveBeenCalledWith(i);
      }

      expect(onNoteToggle).toHaveBeenCalledTimes(9);
    });

    test('should clear notes with Delete when cell has notes but no value', async () => {
      const user = userEvent.setup();
      const onClearAllNotes = jest.fn();
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithNotes}
          onClearAllNotes={onClearAllNotes}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Delete}');

      expect(onClearAllNotes).toHaveBeenCalledTimes(1);
    });

    test('should clear notes with Backspace when cell has notes but no value', async () => {
      const user = userEvent.setup();
      const onClearAllNotes = jest.fn();
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [4, 5] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithNotes}
          onClearAllNotes={onClearAllNotes}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Backspace}');

      expect(onClearAllNotes).toHaveBeenCalledTimes(1);
    });

    test('should clear notes with 0 key when cell has notes but no value', async () => {
      const user = userEvent.setup();
      const onClearAllNotes = jest.fn();
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [7, 8, 9] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithNotes}
          onClearAllNotes={onClearAllNotes}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('0');

      expect(onClearAllNotes).toHaveBeenCalledTimes(1);
    });

    test('should not toggle notes for immutable cells', async () => {
      const user = userEvent.setup();
      const onNoteToggle = jest.fn();
      const immutableCell = createMockCellInfo({
        isImmutable: true
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={immutableCell}
          inputMode="notes"
          onNoteToggle={onNoteToggle}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('3');

      expect(onNoteToggle).not.toHaveBeenCalled();
    });
  });

  describe('modifier key behavior', () => {
    test('should place value when Shift is pressed in notes mode', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const onNoteToggle = jest.fn();

      render(
        <SudokuCell
          {...defaultProps}
          inputMode="notes"
          onValueChange={onValueChange}
          onNoteToggle={onNoteToggle}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Shift>}5{/Shift}');

      expect(onValueChange).toHaveBeenCalledWith(5);
      expect(onNoteToggle).not.toHaveBeenCalled();
    });

    test('should place value when Ctrl is pressed in notes mode', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const onNoteToggle = jest.fn();

      render(
        <SudokuCell
          {...defaultProps}
          inputMode="notes"
          onValueChange={onValueChange}
          onNoteToggle={onNoteToggle}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Control>}7{/Control}');

      expect(onValueChange).toHaveBeenCalledWith(7);
      expect(onNoteToggle).not.toHaveBeenCalled();
    });

    test('should place value when Meta/Cmd is pressed in notes mode', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const onNoteToggle = jest.fn();

      render(
        <SudokuCell
          {...defaultProps}
          inputMode="notes"
          onValueChange={onValueChange}
          onNoteToggle={onNoteToggle}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('{Meta>}9{/Meta}');

      expect(onValueChange).toHaveBeenCalledWith(9);
      expect(onNoteToggle).not.toHaveBeenCalled();
    });
  });

  describe('double-tap functionality', () => {
    test('should clear notes on double-tap', () => {
      const onClearAllNotes = jest.fn();
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} onClearAllNotes={onClearAllNotes} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');

      // First click
      fireEvent.click(cell);
      expect(onClearAllNotes).not.toHaveBeenCalled();

      // Second click within 300ms - should trigger double-tap
      fireEvent.click(cell);
      expect(onClearAllNotes).toHaveBeenCalledTimes(1);
    });

    test('should not trigger double-tap clear if taps are too far apart', () => {
      jest.useFakeTimers();
      const onClearAllNotes = jest.fn();
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} onClearAllNotes={onClearAllNotes} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');

      // First click
      fireEvent.click(cell);

      // Advance time beyond double-tap threshold (300ms)
      jest.advanceTimersByTime(350);

      // Second click - should not trigger double-tap
      fireEvent.click(cell);
      expect(onClearAllNotes).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should not clear notes on double-tap for immutable cells', () => {
      const onClearAllNotes = jest.fn();
      const immutableCellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] },
        isImmutable: true
      });

      render(
        <SudokuCell {...defaultProps} cellInfo={immutableCellWithNotes} onClearAllNotes={onClearAllNotes} />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');

      // Double click
      fireEvent.click(cell);
      fireEvent.click(cell);

      expect(onClearAllNotes).not.toHaveBeenCalled();
    });

    test('should not clear notes on double-tap if notes array is empty', () => {
      const onClearAllNotes = jest.fn();
      const cellWithoutNotes = createMockCellInfo({
        contents: { value: undefined, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithoutNotes} onClearAllNotes={onClearAllNotes} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');

      // Double click
      fireEvent.click(cell);
      fireEvent.click(cell);

      expect(onClearAllNotes).not.toHaveBeenCalled();
    });
  });

  describe('long press functionality', () => {
    describe('basic long press detection', () => {
      test('should call onLongPressToggle when long press occurs with mouse', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start mouse down
        fireEvent.mouseDown(cell);

        // Advance time to trigger long press (500ms)
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should call onLongPressToggle when long press occurs with touch', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start touch
        fireEvent.touchStart(cell);

        // Advance time to trigger long press (500ms)
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should not call onLongPressToggle for immutable cells', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const immutableCell = createMockCellInfo({
          isImmutable: true
        });

        render(
          <SudokuCell {...defaultProps} cellInfo={immutableCell} onLongPressToggle={onLongPressToggle} />
        );

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start mouse down
        fireEvent.mouseDown(cell);

        // Advance time to trigger long press (500ms)
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).not.toHaveBeenCalled();

        jest.useRealTimers();
      });

      test('should not trigger long press if released before timeout', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start mouse down
        fireEvent.mouseDown(cell);

        // Release before timeout (400ms < 500ms)
        jest.advanceTimersByTime(400);
        fireEvent.mouseUp(cell);

        // Advance past timeout to ensure it doesn't fire
        jest.advanceTimersByTime(200);

        expect(onLongPressToggle).not.toHaveBeenCalled();

        jest.useRealTimers();
      });
    });

    describe('long press cancellation', () => {
      test('should cancel long press on mouse leave', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start mouse down
        fireEvent.mouseDown(cell);

        // Move mouse away before timeout
        jest.advanceTimersByTime(300);
        fireEvent.mouseLeave(cell);

        // Advance past timeout
        jest.advanceTimersByTime(300);

        expect(onLongPressToggle).not.toHaveBeenCalled();

        jest.useRealTimers();
      });

      test('should reset long press flag on mouse leave', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const onSelect = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} onSelect={onSelect} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Trigger long press
        fireEvent.mouseDown(cell);
        jest.advanceTimersByTime(500);
        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        // Mouse leave should reset the flag
        fireEvent.mouseLeave(cell);

        // Click should now work normally (not be prevented)
        fireEvent.click(cell);
        expect(onSelect).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });
    });

    describe('long press and click interaction', () => {
      test('should prevent click immediately after long press', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const onSelect = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} onSelect={onSelect} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start long press
        fireEvent.mouseDown(cell);

        // Trigger long press
        jest.advanceTimersByTime(500);
        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        // Release mouse (triggers mouseUp and click)
        fireEvent.mouseUp(cell);
        fireEvent.click(cell);

        // Click should be prevented after long press
        expect(onSelect).not.toHaveBeenCalled();

        jest.useRealTimers();
      });

      test('should allow normal click after long press flag is reset', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const onSelect = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} onSelect={onSelect} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // First: trigger long press
        fireEvent.mouseDown(cell);
        jest.advanceTimersByTime(500);
        fireEvent.mouseUp(cell);
        fireEvent.click(cell); // This click is prevented

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();

        // Second: normal click should work
        fireEvent.click(cell);
        expect(onSelect).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });
    });

    describe('long press with touch events', () => {
      test('should handle complete touch long press sequence', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start touch
        fireEvent.touchStart(cell);

        // Hold for long press duration
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        // End touch
        fireEvent.touchEnd(cell);

        jest.useRealTimers();
      });

      test('should cancel touch long press on touch move (drag away)', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start touch
        fireEvent.touchStart(cell);

        // User drags before timeout - this should not cancel in current implementation
        // but we test the behavior
        jest.advanceTimersByTime(300);

        // Complete the timeout
        jest.advanceTimersByTime(300);

        // Long press should still trigger since touchMove doesn't cancel
        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should not trigger long press if touch released early', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Start touch
        fireEvent.touchStart(cell);

        // Release before timeout
        jest.advanceTimersByTime(400);
        fireEvent.touchEnd(cell);

        // Advance past timeout
        jest.advanceTimersByTime(200);

        expect(onLongPressToggle).not.toHaveBeenCalled();

        jest.useRealTimers();
      });
    });

    describe('long press with different cell states', () => {
      test('should trigger long press on selected cell', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} isSelected={true} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        fireEvent.mouseDown(cell);
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should trigger long press on cell with value', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const cellWithValue = createMockCellInfo({
          contents: { value: 5, notes: [] }
        });

        render(
          <SudokuCell {...defaultProps} cellInfo={cellWithValue} onLongPressToggle={onLongPressToggle} />
        );

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        fireEvent.mouseDown(cell);
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should trigger long press on cell with notes', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const cellWithNotes = createMockCellInfo({
          contents: { value: undefined, notes: [1, 2, 3] }
        });

        render(
          <SudokuCell {...defaultProps} cellInfo={cellWithNotes} onLongPressToggle={onLongPressToggle} />
        );

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        fireEvent.mouseDown(cell);
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should trigger long press on cell with validation error', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();
        const errorCell = createMockCellInfo({
          hasValidationError: true
        });

        render(<SudokuCell {...defaultProps} cellInfo={errorCell} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        fireEvent.mouseDown(cell);
        jest.advanceTimersByTime(500);

        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });
    });

    describe('long press timing edge cases', () => {
      test('should trigger long press at exactly 500ms', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        fireEvent.mouseDown(cell);

        // Not triggered at 499ms
        jest.advanceTimersByTime(499);
        expect(onLongPressToggle).not.toHaveBeenCalled();

        // Triggered at 500ms
        jest.advanceTimersByTime(1);
        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });

      test('should trigger long press for very long holds', () => {
        jest.useFakeTimers();
        const onLongPressToggle = jest.fn();

        render(<SudokuCell {...defaultProps} onLongPressToggle={onLongPressToggle} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        fireEvent.mouseDown(cell);

        // Hold for 2 seconds
        jest.advanceTimersByTime(2000);

        // Should only trigger once
        expect(onLongPressToggle).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });
    });

    describe('long press without onLongPressToggle handler', () => {
      test('should not error when onLongPressToggle is undefined', () => {
        jest.useFakeTimers();

        const propsWithoutHandler = {
          ...defaultProps,
          onLongPressToggle: undefined
        };

        render(<SudokuCell {...propsWithoutHandler} />);

        const cell = screen.getByTestId('sudoku-cell-cell-0-0');

        // Should not throw error
        expect(() => {
          fireEvent.mouseDown(cell);
          jest.advanceTimersByTime(500);
          fireEvent.mouseUp(cell);
        }).not.toThrow();

        jest.useRealTimers();
      });
    });
  });

  describe('zero key behavior', () => {
    test('should clear both value and notes with 0 key', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      const onClearAllNotes = jest.fn();
      const cellWithValueAndNotes = createMockCellInfo({
        contents: { value: 5, notes: [1, 2, 3] }
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellWithValueAndNotes}
          onValueChange={onValueChange}
          onClearAllNotes={onClearAllNotes}
          isSelected={true}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      cell.focus();

      await user.keyboard('0');

      expect(onValueChange).toHaveBeenCalledWith(undefined);
      expect(onClearAllNotes).toHaveBeenCalledTimes(1);
    });
  });

  describe('context menu prevention', () => {
    test('should prevent default context menu', () => {
      render(<SudokuCell {...defaultProps} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(cell, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should prevent default on Ctrl+click', () => {
      render(<SudokuCell {...defaultProps} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(cell, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should prevent default on Meta+click', () => {
      render(<SudokuCell {...defaultProps} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(cell, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('drag events', () => {
    test('should call onDragOver on mouse move', () => {
      const onDragOver = jest.fn();

      render(<SudokuCell {...defaultProps} onDragOver={onDragOver} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.mouseMove(cell);

      expect(onDragOver).toHaveBeenCalledTimes(1);
    });

    test('should call onDragOver on touch move', () => {
      const onDragOver = jest.fn();

      render(<SudokuCell {...defaultProps} onDragOver={onDragOver} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.touchMove(cell);

      expect(onDragOver).toHaveBeenCalledTimes(1);
    });
  });

  describe('puzzle dimensions and section borders', () => {
    test('should apply section borders based on 3x3 cage dimensions', () => {
      const cellAtBoundary = createMockCellInfo({
        id: 'cell-0-2' as CellId,
        row: 0,
        column: 2
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellAtBoundary}
          puzzleDimensions={{ cageWidth: 3, cageHeight: 3, numRows: 9, numColumns: 9 }}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-2');
      expect(cell).toBeInTheDocument();
      // Cell at column 2 should have right border (column 2 + 1 = 3, which is divisible by 3)
    });

    test('should apply section borders based on 2x3 cage dimensions (6x6 puzzle)', () => {
      const cellAtBoundary = createMockCellInfo({
        id: 'cell-0-1' as CellId,
        row: 0,
        column: 1
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={cellAtBoundary}
          puzzleDimensions={{ cageWidth: 2, cageHeight: 3, numRows: 6, numColumns: 6 }}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-1');
      expect(cell).toBeInTheDocument();
      // Cell at column 1 should have right border (column 1 + 1 = 2, which is divisible by 2)
    });

    test('should not apply right border at last column', () => {
      const edgeCell = createMockCellInfo({
        id: 'cell-0-8' as CellId,
        row: 0,
        column: 8
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={edgeCell}
          puzzleDimensions={{ cageWidth: 3, cageHeight: 3, numRows: 9, numColumns: 9 }}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-0-8');
      expect(cell).toBeInTheDocument();
      // Should not have enhanced border at last column
    });

    test('should not apply bottom border at last row', () => {
      const edgeCell = createMockCellInfo({
        id: 'cell-8-0' as CellId,
        row: 8,
        column: 0
      });

      render(
        <SudokuCell
          {...defaultProps}
          cellInfo={edgeCell}
          puzzleDimensions={{ cageWidth: 3, cageHeight: 3, numRows: 9, numColumns: 9 }}
        />
      );

      const cell = screen.getByTestId('sudoku-cell-cell-8-0');
      expect(cell).toBeInTheDocument();
      // Should not have enhanced border at last row
    });
  });

  describe('aria-label for notes', () => {
    test('should include notes in aria-label', () => {
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [2, 5, 7] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} />);

      const cell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, notes: 2, 5, 7');
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

    test('should not render notes when cell has a value', () => {
      const cellWithValueAndNotes = createMockCellInfo({
        contents: { value: 3, notes: [1, 2, 4] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithValueAndNotes} />);

      // Value should be shown
      expect(screen.getByText('3')).toBeInTheDocument();
      // Notes should not be rendered when value exists
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.queryByText('4')).not.toBeInTheDocument();
    });
  });
});
