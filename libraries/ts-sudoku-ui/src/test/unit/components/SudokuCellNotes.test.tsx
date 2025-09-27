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
import { SudokuCell } from '../../../components/SudokuCell';
import { ICellDisplayInfo } from '../../../types';
import { CellId } from '@fgv/ts-sudoku-lib';

describe('SudokuCell - Notes Functionality', () => {
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

  describe('notes display', () => {
    test('should display notes in 3x3 grid when cell has notes', () => {
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 5, 9] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} />);

      // Should render notes grid container
      expect(document.querySelector('.sudoku-cell__notes-grid')).toBeInTheDocument();

      // Should show the correct notes
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();

      // Should not show notes that aren't present
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.queryByText('3')).not.toBeInTheDocument();
    });

    test('should not display notes grid when cell has a value', () => {
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [1, 2, 3] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithValue} />);

      // Should show the value, not the notes
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(document.querySelector('.sudoku-cell__notes-grid')).not.toBeInTheDocument();
    });

    test('should not display notes grid when cell has no notes', () => {
      const emptyCell = createMockCellInfo({
        contents: { value: undefined, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={emptyCell} />);

      expect(document.querySelector('.sudoku-cell__notes-grid')).not.toBeInTheDocument();
    });
  });

  describe('notes-first input paradigm', () => {
    test('should call onNoteToggle when number key pressed in notes mode', async () => {
      const user = userEvent.setup();

      render(<SudokuCell {...defaultProps} isSelected={true} />);

      const cell = screen.getByRole('button');
      cell.focus();

      await user.keyboard('5');

      expect(defaultProps.onNoteToggle).toHaveBeenCalledWith(5);
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });

    test('should call onValueChange when modifier key + number pressed', async () => {
      const user = userEvent.setup();

      render(<SudokuCell {...defaultProps} isSelected={true} />);

      const cell = screen.getByRole('button');
      cell.focus();

      // Shift + 5
      await user.keyboard('{Shift>}5{/Shift}');

      expect(defaultProps.onValueChange).toHaveBeenCalledWith(5);
      expect(defaultProps.onNoteToggle).not.toHaveBeenCalled();
    });

    test('should call onValueChange when in value mode', async () => {
      const user = userEvent.setup();

      render(<SudokuCell {...defaultProps} inputMode="value" isSelected={true} />);

      const cell = screen.getByRole('button');
      cell.focus();

      await user.keyboard('7');

      expect(defaultProps.onValueChange).toHaveBeenCalledWith(7);
      expect(defaultProps.onNoteToggle).not.toHaveBeenCalled();
    });
  });

  describe('double-tap to clear notes', () => {
    test('should call onClearAllNotes on double-click when cell has notes', () => {
      jest.useFakeTimers();

      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} />);

      const cell = screen.getByRole('button');

      // First click
      fireEvent.click(cell);

      // Second click within double-tap delay
      jest.advanceTimersByTime(100);
      fireEvent.click(cell);

      expect(defaultProps.onClearAllNotes).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should not call onClearAllNotes on double-click when cell has no notes', () => {
      jest.useFakeTimers();

      const emptyCell = createMockCellInfo({
        contents: { value: undefined, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={emptyCell} />);

      const cell = screen.getByRole('button');

      // Double click
      fireEvent.click(cell);
      jest.advanceTimersByTime(100);
      fireEvent.click(cell);

      expect(defaultProps.onClearAllNotes).not.toHaveBeenCalled();
      expect(defaultProps.onSelect).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('keyboard deletion', () => {
    test('should clear notes when pressing Delete on cell with notes but no value', async () => {
      const user = userEvent.setup();

      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} isSelected={true} />);

      const cell = screen.getByRole('button');
      cell.focus();

      await user.keyboard('{Delete}');

      expect(defaultProps.onClearAllNotes).toHaveBeenCalled();
    });

    test('should clear value when pressing Delete on cell with value', async () => {
      const user = userEvent.setup();

      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithValue} isSelected={true} />);

      const cell = screen.getByRole('button');
      cell.focus();

      await user.keyboard('{Delete}');

      expect(defaultProps.onValueChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('accessibility', () => {
    test('should include notes in aria-label', () => {
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 5, 9] }
      });

      render(<SudokuCell {...defaultProps} cellInfo={cellWithNotes} />);

      const cell = screen.getByRole('button');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, notes: 1, 5, 9');
    });
  });
});
