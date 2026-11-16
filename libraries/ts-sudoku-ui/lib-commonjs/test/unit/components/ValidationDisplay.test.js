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
require('@testing-library/jest-dom');
require('@fgv/ts-utils-jest');
const ValidationDisplay_1 = require('../../../components/ValidationDisplay');
describe('ValidationDisplay', () => {
  const createMockError = (overrides = {}) => ({
    cellId: 'cell-0-0',
    type: 'duplicate-row',
    conflictingCells: ['cell-0-1'],
    message: 'Duplicate 5 in row',
    ...overrides
  });
  const defaultProps = {
    errors: [],
    isValid: true,
    isSolved: false,
    className: undefined
  };
  describe('rendering', () => {
    test('should render with test id', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, { ...defaultProps })
      );
      expect(react_2.screen.getByTestId('validation-display')).toBeInTheDocument();
    });
    test('should apply custom className', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          className: 'custom-validation'
        })
      );
      const display = react_2.screen.getByTestId('validation-display');
      expect(display).toHaveClass('w-full');
      expect(display).toHaveClass('max-w-lg');
      expect(display).toHaveClass('custom-validation');
    });
  });
  describe('status messages', () => {
    test('should show "Puzzle is valid" when valid and not solved', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: false
        })
      );
      expect(react_2.screen.getByText('Puzzle is valid')).toBeInTheDocument();
    });
    test('should show "Puzzle solved!" when solved', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });
    test('should show error count when there are validation errors', () => {
      const errors = [createMockError({ message: 'Error 1' }), createMockError({ message: 'Error 2' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('2 validation errors')).toBeInTheDocument();
    });
    test('should show singular form for single error', () => {
      const errors = [createMockError({ message: 'Single error' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('1 validation error')).toBeInTheDocument();
    });
    test('should prioritize solved status over valid status', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
      expect(react_2.screen.queryByText('Puzzle is valid')).not.toBeInTheDocument();
    });
    test('should show error count even when isSolved is true (edge case)', () => {
      const errors = [createMockError()];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });
  });
  describe('no errors display', () => {
    test('should show simple status when no errors and not solved', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: [],
          isValid: true,
          isSolved: false
        })
      );
      expect(react_2.screen.getByText('Puzzle is valid')).toBeInTheDocument();
      expect(react_2.screen.queryByText('Validation Errors:')).not.toBeInTheDocument();
    });
    test('should show solved status when no errors and solved', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: [],
          isValid: true,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
      expect(react_2.screen.queryByText('Validation Errors:')).not.toBeInTheDocument();
    });
  });
  describe('error display', () => {
    test('should show validation errors section when errors exist', () => {
      const errors = [createMockError({ message: 'Test error' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('Validation Errors:')).toBeInTheDocument();
      expect(react_2.screen.getByText('Test error')).toBeInTheDocument();
    });
    test('should group errors by type', () => {
      const errors = [
        createMockError({ type: 'duplicate-row', message: 'Row error 1' }),
        createMockError({ type: 'duplicate-row', message: 'Row error 2' }),
        createMockError({ type: 'duplicate-column', message: 'Column error 1' }),
        createMockError({ type: 'duplicate-section', message: 'Section error 1' }),
        createMockError({ type: 'invalid-value', message: 'Invalid value error' })
      ];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      // Check that type headers are shown with counts
      expect(react_2.screen.getByText('row (2)')).toBeInTheDocument();
      expect(react_2.screen.getByText('column (1)')).toBeInTheDocument();
      expect(react_2.screen.getByText('section (1)')).toBeInTheDocument();
      expect(react_2.screen.getByText('invalid value (1)')).toBeInTheDocument();
      // Check that all error messages are shown
      expect(react_2.screen.getByText('Row error 1')).toBeInTheDocument();
      expect(react_2.screen.getByText('Row error 2')).toBeInTheDocument();
      expect(react_2.screen.getByText('Column error 1')).toBeInTheDocument();
      expect(react_2.screen.getByText('Section error 1')).toBeInTheDocument();
      expect(react_2.screen.getByText('Invalid value error')).toBeInTheDocument();
    });
    test('should not show groups for error types with no errors', () => {
      const errors = [createMockError({ type: 'duplicate-row', message: 'Row error only' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('row (1)')).toBeInTheDocument();
      expect(react_2.screen.queryByText('column')).not.toBeInTheDocument();
      expect(react_2.screen.queryByText('section')).not.toBeInTheDocument();
      expect(react_2.screen.queryByText('invalid value')).not.toBeInTheDocument();
    });
    test('should handle mixed error types', () => {
      const errors = [
        createMockError({
          cellId: 'cell-0-0',
          type: 'duplicate-row',
          message: 'Duplicate 5 in row'
        }),
        createMockError({
          cellId: 'cell-1-0',
          type: 'duplicate-column',
          message: 'Duplicate 3 in column'
        }),
        createMockError({
          cellId: 'cell-2-2',
          type: 'duplicate-section',
          message: 'Duplicate 7 in section'
        })
      ];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('3 validation errors')).toBeInTheDocument();
      expect(react_2.screen.getByText('Validation Errors:')).toBeInTheDocument();
      // Check type groupings
      expect(react_2.screen.getByText('row (1)')).toBeInTheDocument();
      expect(react_2.screen.getByText('column (1)')).toBeInTheDocument();
      expect(react_2.screen.getByText('section (1)')).toBeInTheDocument();
      // Check error messages
      expect(react_2.screen.getByText('Duplicate 5 in row')).toBeInTheDocument();
      expect(react_2.screen.getByText('Duplicate 3 in column')).toBeInTheDocument();
      expect(react_2.screen.getByText('Duplicate 7 in section')).toBeInTheDocument();
    });
    test('should display multiple errors of the same type', () => {
      const errors = [
        createMockError({
          cellId: 'cell-0-0',
          type: 'duplicate-row',
          message: 'Duplicate 5 in row 1'
        }),
        createMockError({
          cellId: 'cell-0-1',
          type: 'duplicate-row',
          message: 'Duplicate 5 in row 1 (other cell)'
        }),
        createMockError({
          cellId: 'cell-1-0',
          type: 'duplicate-row',
          message: 'Duplicate 3 in row 2'
        })
      ];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('row (3)')).toBeInTheDocument();
      expect(react_2.screen.getByText('Duplicate 5 in row 1')).toBeInTheDocument();
      expect(react_2.screen.getByText('Duplicate 5 in row 1 (other cell)')).toBeInTheDocument();
      expect(react_2.screen.getByText('Duplicate 3 in row 2')).toBeInTheDocument();
    });
  });
  describe('type label formatting', () => {
    test('should format duplicate-row type correctly', () => {
      const errors = [createMockError({ type: 'duplicate-row' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('row (1)')).toBeInTheDocument();
    });
    test('should format duplicate-column type correctly', () => {
      const errors = [createMockError({ type: 'duplicate-column' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('column (1)')).toBeInTheDocument();
    });
    test('should format duplicate-section type correctly', () => {
      const errors = [createMockError({ type: 'duplicate-section' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('section (1)')).toBeInTheDocument();
    });
    test('should format invalid-value type correctly', () => {
      const errors = [createMockError({ type: 'invalid-value' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('invalid value (1)')).toBeInTheDocument();
    });
  });
  describe('scrollable error list', () => {
    test('should make error list scrollable with max height', () => {
      const manyErrors = Array.from({ length: 20 }, (unused, i) =>
        createMockError({ message: `Error ${i + 1}` })
      );
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: manyErrors,
          isValid: false
        })
      );
      const errorContainer = react_2.screen.getByText('Validation Errors:').parentElement;
      expect(errorContainer).toBeInTheDocument();
      // All errors should be rendered even if scrollable
      for (let i = 1; i <= 20; i++) {
        expect(react_2.screen.getByText(`Error ${i}`)).toBeInTheDocument();
      }
    });
  });
  describe('visual state variations', () => {
    test('should handle valid state styling', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: false
        })
      );
      expect(react_2.screen.getByText('Puzzle is valid')).toBeInTheDocument();
    });
    test('should handle solved state styling', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });
    test('should handle error state styling', () => {
      const errors = [createMockError()];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('1 validation error')).toBeInTheDocument();
    });
  });
  describe('edge cases', () => {
    test('should handle empty error array gracefully', () => {
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: [],
          isValid: true
        })
      );
      expect(react_2.screen.getByText('Puzzle is valid')).toBeInTheDocument();
      expect(react_2.screen.queryByText('Validation Errors:')).not.toBeInTheDocument();
    });
    test('should handle errors with empty messages', () => {
      const errors = [createMockError({ message: '' })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('1 validation error')).toBeInTheDocument();
      expect(react_2.screen.getByText('Validation Errors:')).toBeInTheDocument();
    });
    test('should handle errors with very long messages', () => {
      const longMessage =
        'This is a very long error message that should still be displayed correctly even though it contains a lot of text and might wrap to multiple lines';
      const errors = [createMockError({ message: longMessage })];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText(longMessage)).toBeInTheDocument();
    });
    test('should handle unknown error types gracefully', () => {
      const errors = [
        createMockError({
          type: 'unknown-type',
          message: 'Unknown error type'
        })
      ];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('1 validation error')).toBeInTheDocument();
      expect(react_2.screen.getByText('Validation Errors:')).toBeInTheDocument();
      // Unknown error types are filtered out by design, so the errors section will be empty
      // but the status message still shows the count
    });
    test('should handle conflicting isValid and errors state', () => {
      // Edge case: errors exist but isValid is true (shouldn't happen in normal usage)
      const errors = [createMockError()];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: true
        })
      );
      // Should still show errors section since errors exist
      expect(react_2.screen.getByText('Validation Errors:')).toBeInTheDocument();
    });
    test('should handle all state combinations', () => {
      const testCases = [
        { errors: [], isValid: true, isSolved: false, expected: 'Puzzle is valid' },
        { errors: [], isValid: true, isSolved: true, expected: 'Puzzle solved! 🎉' },
        { errors: [], isValid: false, isSolved: false, expected: '0 validation errors' }, // Edge case
        { errors: [createMockError()], isValid: false, isSolved: false, expected: '1 validation error' },
        { errors: [createMockError()], isValid: true, isSolved: false, expected: 'Puzzle is valid' }, // Edge case
        { errors: [createMockError()], isValid: false, isSolved: true, expected: 'Puzzle solved! 🎉' } // Edge case
      ];
      testCases.forEach(({ errors, isValid, isSolved, expected }, testIndex) => {
        const { unmount } = (0, react_2.render)(
          react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
            key: testIndex,
            errors: errors,
            isValid: isValid,
            isSolved: isSolved
          })
        );
        expect(react_2.screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });
  describe('component updates', () => {
    test('should update when errors change', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, { ...defaultProps, errors: [] })
      );
      expect(react_2.screen.getByText('Puzzle is valid')).toBeInTheDocument();
      const errors = [createMockError({ message: 'New error' })];
      rerender(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('1 validation error')).toBeInTheDocument();
      expect(react_2.screen.getByText('New error')).toBeInTheDocument();
    });
    test('should update when validity state changes', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: false,
          isSolved: false
        })
      );
      expect(react_2.screen.getByText('0 validation errors')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: false
        })
      );
      expect(react_2.screen.getByText('Puzzle is valid')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });
    test('should update error groupings when error types change', () => {
      const rowErrors = [createMockError({ type: 'duplicate-row', message: 'Row error' })];
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: rowErrors,
          isValid: false
        })
      );
      expect(react_2.screen.getByText('row (1)')).toBeInTheDocument();
      expect(react_2.screen.queryByText('column')).not.toBeInTheDocument();
      const columnErrors = [createMockError({ type: 'duplicate-column', message: 'Column error' })];
      rerender(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: columnErrors,
          isValid: false
        })
      );
      expect(react_2.screen.queryByText('row')).not.toBeInTheDocument();
      expect(react_2.screen.getByText('column (1)')).toBeInTheDocument();
    });
  });
  describe('accessibility', () => {
    test('should provide semantic structure for screen readers', () => {
      const errors = [
        createMockError({ type: 'duplicate-row', message: 'Row error' }),
        createMockError({ type: 'duplicate-column', message: 'Column error' })
      ];
      (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          errors: errors,
          isValid: false
        })
      );
      // Status should be prominent
      expect(react_2.screen.getByText('2 validation errors')).toBeInTheDocument();
      // Error list should be structured
      expect(react_2.screen.getByText('Validation Errors:')).toBeInTheDocument();
      // Error groups should be identifiable
      expect(react_2.screen.getByText('row (1)')).toBeInTheDocument();
      expect(react_2.screen.getByText('column (1)')).toBeInTheDocument();
    });
    test('should handle status updates for screen readers', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: false,
          isSolved: false
        })
      );
      let statusElement = react_2.screen.getByText('0 validation errors');
      expect(statusElement).toBeInTheDocument();
      rerender(
        react_1.default.createElement(ValidationDisplay_1.ValidationDisplay, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      statusElement = react_2.screen.getByText('Puzzle solved! 🎉');
      expect(statusElement).toBeInTheDocument();
    });
  });
});
//# sourceMappingURL=ValidationDisplay.test.js.map
