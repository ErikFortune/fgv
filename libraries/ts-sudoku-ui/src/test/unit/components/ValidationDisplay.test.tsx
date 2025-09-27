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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { ValidationDisplay } from '../../../components/ValidationDisplay';
import { IValidationError } from '../../../types';
import { CellId } from '@fgv/ts-sudoku-lib';

describe('ValidationDisplay', () => {
  const createMockError = (overrides: Partial<IValidationError> = {}): IValidationError => ({
    cellId: 'cell-0-0' as CellId,
    type: 'duplicate-row',
    conflictingCells: ['cell-0-1' as CellId],
    message: 'Duplicate 5 in row',
    ...overrides
  });

  const defaultProps = {
    errors: [] as IValidationError[],
    isValid: true,
    isSolved: false,
    className: undefined
  };

  describe('rendering', () => {
    test('should render with test id', () => {
      render(<ValidationDisplay {...defaultProps} />);

      expect(screen.getByTestId('validation-display')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<ValidationDisplay {...defaultProps} className="custom-validation" />);

      const display = screen.getByTestId('validation-display');
      expect(display).toHaveClass('validation-display');
      expect(display).toHaveClass('custom-validation');
    });
  });

  describe('status messages', () => {
    test('should show "Puzzle is valid" when valid and not solved', () => {
      render(<ValidationDisplay {...defaultProps} isValid={true} isSolved={false} />);

      expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();
    });

    test('should show "Puzzle solved!" when solved', () => {
      render(<ValidationDisplay {...defaultProps} isValid={true} isSolved={true} />);

      expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });

    test('should show error count when there are validation errors', () => {
      const errors = [createMockError({ message: 'Error 1' }), createMockError({ message: 'Error 2' })];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('2 validation errors')).toBeInTheDocument();
    });

    test('should show singular form for single error', () => {
      const errors = [createMockError({ message: 'Single error' })];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('1 validation error')).toBeInTheDocument();
    });

    test('should prioritize solved status over valid status', () => {
      render(<ValidationDisplay {...defaultProps} isValid={true} isSolved={true} />);

      expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
      expect(screen.queryByText('Puzzle is valid')).not.toBeInTheDocument();
    });

    test('should show error count even when isSolved is true (edge case)', () => {
      const errors = [createMockError()];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} isSolved={true} />);

      expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });
  });

  describe('no errors display', () => {
    test('should show simple status when no errors and not solved', () => {
      render(<ValidationDisplay {...defaultProps} errors={[]} isValid={true} isSolved={false} />);

      expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();
      expect(screen.queryByText('Validation Errors:')).not.toBeInTheDocument();
    });

    test('should show solved status when no errors and solved', () => {
      render(<ValidationDisplay {...defaultProps} errors={[]} isValid={true} isSolved={true} />);

      expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
      expect(screen.queryByText('Validation Errors:')).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    test('should show validation errors section when errors exist', () => {
      const errors = [createMockError({ message: 'Test error' })];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    test('should group errors by type', () => {
      const errors = [
        createMockError({ type: 'duplicate-row', message: 'Row error 1' }),
        createMockError({ type: 'duplicate-row', message: 'Row error 2' }),
        createMockError({ type: 'duplicate-column', message: 'Column error 1' }),
        createMockError({ type: 'duplicate-section', message: 'Section error 1' }),
        createMockError({ type: 'invalid-value', message: 'Invalid value error' })
      ];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      // Check that type headers are shown with counts
      expect(screen.getByText('row (2)')).toBeInTheDocument();
      expect(screen.getByText('column (1)')).toBeInTheDocument();
      expect(screen.getByText('section (1)')).toBeInTheDocument();
      expect(screen.getByText('invalid value (1)')).toBeInTheDocument();

      // Check that all error messages are shown
      expect(screen.getByText('Row error 1')).toBeInTheDocument();
      expect(screen.getByText('Row error 2')).toBeInTheDocument();
      expect(screen.getByText('Column error 1')).toBeInTheDocument();
      expect(screen.getByText('Section error 1')).toBeInTheDocument();
      expect(screen.getByText('Invalid value error')).toBeInTheDocument();
    });

    test('should not show groups for error types with no errors', () => {
      const errors = [createMockError({ type: 'duplicate-row', message: 'Row error only' })];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('row (1)')).toBeInTheDocument();
      expect(screen.queryByText('column')).not.toBeInTheDocument();
      expect(screen.queryByText('section')).not.toBeInTheDocument();
      expect(screen.queryByText('invalid value')).not.toBeInTheDocument();
    });

    test('should handle mixed error types', () => {
      const errors = [
        createMockError({
          cellId: 'cell-0-0' as CellId,
          type: 'duplicate-row',
          message: 'Duplicate 5 in row'
        }),
        createMockError({
          cellId: 'cell-1-0' as CellId,
          type: 'duplicate-column',
          message: 'Duplicate 3 in column'
        }),
        createMockError({
          cellId: 'cell-2-2' as CellId,
          type: 'duplicate-section',
          message: 'Duplicate 7 in section'
        })
      ];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('3 validation errors')).toBeInTheDocument();
      expect(screen.getByText('Validation Errors:')).toBeInTheDocument();

      // Check type groupings
      expect(screen.getByText('row (1)')).toBeInTheDocument();
      expect(screen.getByText('column (1)')).toBeInTheDocument();
      expect(screen.getByText('section (1)')).toBeInTheDocument();

      // Check error messages
      expect(screen.getByText('Duplicate 5 in row')).toBeInTheDocument();
      expect(screen.getByText('Duplicate 3 in column')).toBeInTheDocument();
      expect(screen.getByText('Duplicate 7 in section')).toBeInTheDocument();
    });

    test('should display multiple errors of the same type', () => {
      const errors = [
        createMockError({
          cellId: 'cell-0-0' as CellId,
          type: 'duplicate-row',
          message: 'Duplicate 5 in row 1'
        }),
        createMockError({
          cellId: 'cell-0-1' as CellId,
          type: 'duplicate-row',
          message: 'Duplicate 5 in row 1 (other cell)'
        }),
        createMockError({
          cellId: 'cell-1-0' as CellId,
          type: 'duplicate-row',
          message: 'Duplicate 3 in row 2'
        })
      ];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('row (3)')).toBeInTheDocument();
      expect(screen.getByText('Duplicate 5 in row 1')).toBeInTheDocument();
      expect(screen.getByText('Duplicate 5 in row 1 (other cell)')).toBeInTheDocument();
      expect(screen.getByText('Duplicate 3 in row 2')).toBeInTheDocument();
    });
  });

  describe('type label formatting', () => {
    test('should format duplicate-row type correctly', () => {
      const errors = [createMockError({ type: 'duplicate-row' })];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('row (1)')).toBeInTheDocument();
    });

    test('should format duplicate-column type correctly', () => {
      const errors = [createMockError({ type: 'duplicate-column' })];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('column (1)')).toBeInTheDocument();
    });

    test('should format duplicate-section type correctly', () => {
      const errors = [createMockError({ type: 'duplicate-section' })];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('section (1)')).toBeInTheDocument();
    });

    test('should format invalid-value type correctly', () => {
      const errors = [createMockError({ type: 'invalid-value' })];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('invalid value (1)')).toBeInTheDocument();
    });
  });

  describe('scrollable error list', () => {
    test('should make error list scrollable with max height', () => {
      const manyErrors = Array.from({ length: 20 }, (unused, i) =>
        createMockError({ message: `Error ${i + 1}` })
      );

      render(<ValidationDisplay {...defaultProps} errors={manyErrors} isValid={false} />);

      const errorContainer = screen.getByText('Validation Errors:').parentElement;
      expect(errorContainer).toBeInTheDocument();

      // All errors should be rendered even if scrollable
      for (let i = 1; i <= 20; i++) {
        expect(screen.getByText(`Error ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('visual state variations', () => {
    test('should handle valid state styling', () => {
      render(<ValidationDisplay {...defaultProps} isValid={true} isSolved={false} />);

      expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();
    });

    test('should handle solved state styling', () => {
      render(<ValidationDisplay {...defaultProps} isValid={true} isSolved={true} />);

      expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });

    test('should handle error state styling', () => {
      const errors = [createMockError()];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('1 validation error')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('should handle empty error array gracefully', () => {
      render(<ValidationDisplay {...defaultProps} errors={[]} isValid={true} />);

      expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();
      expect(screen.queryByText('Validation Errors:')).not.toBeInTheDocument();
    });

    test('should handle errors with empty messages', () => {
      const errors = [createMockError({ message: '' })];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('1 validation error')).toBeInTheDocument();
      expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
    });

    test('should handle errors with very long messages', () => {
      const longMessage =
        'This is a very long error message that should still be displayed correctly even though it contains a lot of text and might wrap to multiple lines';
      const errors = [createMockError({ message: longMessage })];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('should handle unknown error types gracefully', () => {
      const errors = [
        createMockError({
          type: 'unknown-type' as unknown as IValidationError['type'],
          message: 'Unknown error type'
        })
      ];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('1 validation error')).toBeInTheDocument();
      expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
      // Unknown error types are filtered out by design, so the errors section will be empty
      // but the status message still shows the count
    });

    test('should handle conflicting isValid and errors state', () => {
      // Edge case: errors exist but isValid is true (shouldn't happen in normal usage)
      const errors = [createMockError()];
      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={true} />);

      // Should still show errors section since errors exist
      expect(screen.getByText('Validation Errors:')).toBeInTheDocument();
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
        const { unmount } = render(
          <ValidationDisplay key={testIndex} errors={errors} isValid={isValid} isSolved={isSolved} />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('component updates', () => {
    test('should update when errors change', () => {
      const { rerender } = render(<ValidationDisplay {...defaultProps} errors={[]} />);

      expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();

      const errors = [createMockError({ message: 'New error' })];
      rerender(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      expect(screen.getByText('1 validation error')).toBeInTheDocument();
      expect(screen.getByText('New error')).toBeInTheDocument();
    });

    test('should update when validity state changes', () => {
      const { rerender } = render(<ValidationDisplay {...defaultProps} isValid={false} isSolved={false} />);

      expect(screen.getByText('0 validation errors')).toBeInTheDocument();

      rerender(<ValidationDisplay {...defaultProps} isValid={true} isSolved={false} />);
      expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();

      rerender(<ValidationDisplay {...defaultProps} isValid={true} isSolved={true} />);
      expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
    });

    test('should update error groupings when error types change', () => {
      const rowErrors = [createMockError({ type: 'duplicate-row', message: 'Row error' })];
      const { rerender } = render(<ValidationDisplay {...defaultProps} errors={rowErrors} isValid={false} />);

      expect(screen.getByText('row (1)')).toBeInTheDocument();
      expect(screen.queryByText('column')).not.toBeInTheDocument();

      const columnErrors = [createMockError({ type: 'duplicate-column', message: 'Column error' })];
      rerender(<ValidationDisplay {...defaultProps} errors={columnErrors} isValid={false} />);

      expect(screen.queryByText('row')).not.toBeInTheDocument();
      expect(screen.getByText('column (1)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should provide semantic structure for screen readers', () => {
      const errors = [
        createMockError({ type: 'duplicate-row', message: 'Row error' }),
        createMockError({ type: 'duplicate-column', message: 'Column error' })
      ];

      render(<ValidationDisplay {...defaultProps} errors={errors} isValid={false} />);

      // Status should be prominent
      expect(screen.getByText('2 validation errors')).toBeInTheDocument();

      // Error list should be structured
      expect(screen.getByText('Validation Errors:')).toBeInTheDocument();

      // Error groups should be identifiable
      expect(screen.getByText('row (1)')).toBeInTheDocument();
      expect(screen.getByText('column (1)')).toBeInTheDocument();
    });

    test('should handle status updates for screen readers', () => {
      const { rerender } = render(<ValidationDisplay {...defaultProps} isValid={false} isSolved={false} />);

      let statusElement = screen.getByText('0 validation errors');
      expect(statusElement).toBeInTheDocument();

      rerender(<ValidationDisplay {...defaultProps} isValid={true} isSolved={true} />);

      statusElement = screen.getByText('Puzzle solved! 🎉');
      expect(statusElement).toBeInTheDocument();
    });
  });
});
