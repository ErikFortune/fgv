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
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importDefault(require('react'));
const react_2 = require('@testing-library/react');
const user_event_1 = tslib_1.__importDefault(require('@testing-library/user-event'));
require('@testing-library/jest-dom');
require('@fgv/ts-utils-jest');
const SudokuCell_1 = require('../../../components/SudokuCell');
describe('SudokuCell - Notes Functionality', () => {
  const createMockCellInfo = (overrides = {}) => ({
    id: 'cell-0-0',
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
    inputMode: 'notes',
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
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, cellInfo: cellWithNotes })
      );
      // Notes are rendered as individual elements in a grid
      // Should show the correct notes
      expect(react_2.screen.getByText('1')).toBeInTheDocument();
      expect(react_2.screen.getByText('5')).toBeInTheDocument();
      expect(react_2.screen.getByText('9')).toBeInTheDocument();
      // Should not show notes that aren't present
      expect(react_2.screen.queryByText('2')).not.toBeInTheDocument();
      expect(react_2.screen.queryByText('3')).not.toBeInTheDocument();
    });
    test('should not display notes grid when cell has a value', () => {
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [1, 2, 3] }
      });
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, cellInfo: cellWithValue })
      );
      // Should show the value, not the notes
      expect(react_2.screen.getByText('5')).toBeInTheDocument();
      expect(document.querySelector('.sudoku-cell__notes-grid')).not.toBeInTheDocument();
    });
    test('should not display notes grid when cell has no notes', () => {
      const emptyCell = createMockCellInfo({
        contents: { value: undefined, notes: [] }
      });
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, cellInfo: emptyCell })
      );
      expect(document.querySelector('.sudoku-cell__notes-grid')).not.toBeInTheDocument();
    });
  });
  describe('notes-first input paradigm', () => {
    test('should call onNoteToggle when number key pressed in notes mode', async () => {
      const user = user_event_1.default.setup();
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, isSelected: true })
      );
      const cell = react_2.screen.getByRole('button');
      cell.focus();
      await user.keyboard('5');
      expect(defaultProps.onNoteToggle).toHaveBeenCalledWith(5);
      expect(defaultProps.onValueChange).not.toHaveBeenCalled();
    });
    test('should call onValueChange when modifier key + number pressed', async () => {
      const user = user_event_1.default.setup();
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, isSelected: true })
      );
      const cell = react_2.screen.getByRole('button');
      cell.focus();
      // Shift + 5
      await user.keyboard('{Shift>}5{/Shift}');
      expect(defaultProps.onValueChange).toHaveBeenCalledWith(5);
      expect(defaultProps.onNoteToggle).not.toHaveBeenCalled();
    });
    test('should call onValueChange when in value mode', async () => {
      const user = user_event_1.default.setup();
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, {
          ...defaultProps,
          inputMode: 'value',
          isSelected: true
        })
      );
      const cell = react_2.screen.getByRole('button');
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
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, cellInfo: cellWithNotes })
      );
      const cell = react_2.screen.getByRole('button');
      // First click
      react_2.fireEvent.click(cell);
      // Second click within double-tap delay
      jest.advanceTimersByTime(100);
      react_2.fireEvent.click(cell);
      expect(defaultProps.onClearAllNotes).toHaveBeenCalled();
      jest.useRealTimers();
    });
    test('should not call onClearAllNotes on double-click when cell has no notes', () => {
      jest.useFakeTimers();
      const emptyCell = createMockCellInfo({
        contents: { value: undefined, notes: [] }
      });
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, cellInfo: emptyCell })
      );
      const cell = react_2.screen.getByRole('button');
      // Double click
      react_2.fireEvent.click(cell);
      jest.advanceTimersByTime(100);
      react_2.fireEvent.click(cell);
      expect(defaultProps.onClearAllNotes).not.toHaveBeenCalled();
      expect(defaultProps.onSelect).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });
  describe('keyboard deletion', () => {
    test('should clear notes when pressing Delete on cell with notes but no value', async () => {
      const user = user_event_1.default.setup();
      const cellWithNotes = createMockCellInfo({
        contents: { value: undefined, notes: [1, 2, 3] }
      });
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, {
          ...defaultProps,
          cellInfo: cellWithNotes,
          isSelected: true
        })
      );
      const cell = react_2.screen.getByRole('button');
      cell.focus();
      await user.keyboard('{Delete}');
      expect(defaultProps.onClearAllNotes).toHaveBeenCalled();
    });
    test('should clear value when pressing Delete on cell with value', async () => {
      const user = user_event_1.default.setup();
      const cellWithValue = createMockCellInfo({
        contents: { value: 5, notes: [] }
      });
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, {
          ...defaultProps,
          cellInfo: cellWithValue,
          isSelected: true
        })
      );
      const cell = react_2.screen.getByRole('button');
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
      (0, react_2.render)(
        react_1.default.createElement(SudokuCell_1.SudokuCell, { ...defaultProps, cellInfo: cellWithNotes })
      );
      const cell = react_2.screen.getByRole('button');
      expect(cell).toHaveAttribute('aria-label', 'Row 1, Column 1, notes: 1, 5, 9');
    });
  });
});
//# sourceMappingURL=SudokuCellNotes.test.js.map
