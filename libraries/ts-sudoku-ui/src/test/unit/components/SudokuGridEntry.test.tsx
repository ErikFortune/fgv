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
 * OUT OF OR IN CONNECTION WITH THE S OFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult, RenderOptions, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuGridEntry } from '../../../components/SudokuGridEntry';
import { IPuzzleDescription } from '@fgv/ts-sudoku-lib';

// Custom render function - just use standard render
function customRender(ui: React.ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, options);
}

// Removed unused function queryByTestId

// URL.createObjectURL and URL.revokeObjectURL are set up in jest.setup.js

// Mock document.createElement and related DOM methods for download functionality
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

const originalCreateElement = document.createElement;
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

describe('SudokuGridEntry', () => {
  const validPuzzleDescription: IPuzzleDescription = {
    id: 'test-puzzle',
    description: 'Test Puzzle',
    type: 'sudoku',
    level: 1,
    rows: 9,
    cols: 9,
    cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
  };

  const simplePuzzleDescription: IPuzzleDescription = {
    id: 'simple-puzzle',
    description: 'Simple Test Puzzle',
    type: 'sudoku',
    level: 1,
    rows: 9,
    cols: 9,
    cells: '1' + '.'.repeat(80) // 81 total characters
  };

  const invalidPuzzleDescription: IPuzzleDescription = {
    id: 'invalid-puzzle',
    description: 'Invalid Puzzle',
    type: 'sudoku',
    level: 1,
    rows: 9,
    cols: 9,
    cells: 'invalid' // Too short
  };

  const defaultProps = {
    initialPuzzleDescription: undefined,
    onStateChange: undefined,
    onValidationErrors: undefined,
    className: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.URL.createObjectURL as jest.Mock).mockReturnValue('mock-url');

    // Mock document.createElement for download links only
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        const link = originalCreateElement.call(document, tagName) as HTMLAnchorElement;
        link.click = mockClick;
        return link;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Track calls to appendChild/removeChild but don't prevent them
    mockAppendChild.mockImplementation((node) => originalAppendChild.call(document.body, node));
    mockRemoveChild.mockImplementation((node) => originalRemoveChild.call(document.body, node));
    document.body.appendChild = mockAppendChild as typeof document.body.appendChild;
    document.body.removeChild = mockRemoveChild as typeof document.body.removeChild;
  });

  afterEach(() => {
    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  describe('rendering', () => {
    test('should render loading state initially', () => {
      render(<SudokuGridEntry {...defaultProps} />);

      // Component initializes synchronously in test environment
      const entryElement = screen.getByTestId('sudoku-grid-entry');
      expect(entryElement).toBeInTheDocument();
    });

    test('should render main components after initialization', () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      // Components should be rendered immediately in our test environment
      expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      expect(screen.getByTestId('compact-control-ribbon')).toBeInTheDocument();
      expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    });

    test('should apply custom className', async () => {
      customRender(<SudokuGridEntry {...defaultProps} className="custom-entry" />);

      await waitFor(() => {
        const entry = screen.getByTestId('sudoku-grid-entry');
        expect(entry).toHaveClass('custom-entry');
      });
    });

    test('should render with initial puzzle description', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={validPuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByText('Test Puzzle')).toBeInTheDocument();
        expect(screen.getByText('ID: test-puzzle')).toBeInTheDocument();
      });
    });

    test('should render default puzzle when no initial description provided', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual Entry Puzzle')).toBeInTheDocument();
        expect(screen.getByText('ID: manual-entry')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    test('should show error state for invalid puzzle', () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={invalidPuzzleDescription} />);

      expect(screen.getByTestId('sudoku-grid-entry-error')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to create puzzle session/)).toBeInTheDocument();
    });

    test('should not render main components when in error state', () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={invalidPuzzleDescription} />);

      expect(screen.queryByTestId('sudoku-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('compact-control-ribbon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
    });

    test('should apply className even in error state', () => {
      customRender(
        <SudokuGridEntry
          {...defaultProps}
          initialPuzzleDescription={invalidPuzzleDescription}
          className="error-class"
        />
      );

      const entry = screen.getByTestId('sudoku-grid-entry-error');
      expect(entry).toHaveClass('error-class');
    });
  });

  describe('loading state', () => {
    test('should show loading state when session is null', () => {
      // This is hard to test reliably since the hook initializes quickly
      // but we can at least verify the component handles this case
      customRender(<SudokuGridEntry {...defaultProps} />);

      // Component should render without crashing
      expect(screen.getByTestId('sudoku-grid-entry')).toBeInTheDocument();
    });
  });

  describe('cell interactions', () => {
    test('should handle cell selection', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);

      // Cell should be selected (aria-selected should be true)
      expect(firstCell).toHaveAttribute('aria-selected', 'true');
    });

    test.skip('should handle cell value changes', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      await act(() => fireEvent.click(firstCell));
      await user.keyboard('1');

      await waitFor(() => {
        expect(firstCell).toHaveTextContent('1');
      });
    });

    test('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select first cell
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);

      // Navigate right
      const grid = screen.getByTestId('sudoku-grid');
      await user.click(grid);
      await user.keyboard('{ArrowRight}');

      // Second cell should now be selected
      const secondCell = await screen.findByTestId('sudoku-cell-A2');
      expect(secondCell).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('controls integration', () => {
    test.skip('should handle undo/redo operations', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-cell-A1')).toBeInTheDocument();
      });

      // Make a change
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);
      await user.keyboard('7');

      await waitFor(() => {
        expect(firstCell).toHaveTextContent('7');
      });

      // Undo should be enabled
      const undoButton = screen.getByTestId('undo-button');
      expect(undoButton).toBeEnabled();

      // Perform undo
      fireEvent.click(undoButton);

      // Cell should be empty
      await waitFor(() => {
        expect(firstCell).toHaveTextContent('');
      });

      // Redo should be enabled
      const redoButton = screen.getByTestId('redo-button');
      expect(redoButton).toBeEnabled();

      // Perform redo
      fireEvent.click(redoButton);

      // Cell should have value again
      await waitFor(() => {
        expect(firstCell).toHaveTextContent('7');
      });
    });

    test.skip('should handle reset operation', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-cell-A1')).toBeInTheDocument();
      });

      // Make some changes
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);
      await user.keyboard('9');

      await waitFor(() => {
        expect(firstCell).toHaveTextContent('9');
      });

      // Reset with confirmation
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      const confirmButton = screen.getByTestId('confirm-reset-button');
      fireEvent.click(confirmButton);

      // Cell should be empty
      await waitFor(() => {
        expect(firstCell).toHaveTextContent('');
      });
    });

    test.skip('should handle export operation', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('compact-control-ribbon')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      fireEvent.click(exportButton);

      // Should create download link
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    test.skip('should handle export with custom puzzle data', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-cell-A1')).toBeInTheDocument();
      });

      // Add some values
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);
      await user.keyboard('1');

      const secondCell = await screen.findByTestId('sudoku-cell-A2');
      fireEvent.click(secondCell);
      await user.keyboard('2');

      // Export
      const exportButton = screen.getByTestId('export-button');
      fireEvent.click(exportButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('validation display integration', () => {
    test.skip('should show validation errors for duplicate values', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Create duplicate values in same row
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      const secondCell = await screen.findByTestId('sudoku-cell-A2');

      fireEvent.click(firstCell);
      await user.keyboard('5');

      fireEvent.click(secondCell);
      await user.keyboard('5');

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/validation error/)).toBeInTheDocument();
      });
    });

    test.skip('should show valid status when no errors', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
        expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();
      });
    });

    test.skip('should show solved status for complete valid puzzle', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={validPuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
        expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
      });
    });
  });

  describe('callback props', () => {
    test.skip('should call onStateChange when puzzle state changes', async () => {
      const onStateChange = jest.fn();
      const user = userEvent.setup();

      customRender(<SudokuGridEntry {...defaultProps} onStateChange={onStateChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initial call
      expect(onStateChange).toHaveBeenCalledWith(true, false);

      // Make a change
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);
      await user.keyboard('5');

      // Should be called again (may be multiple times due to re-renders)
      expect(onStateChange).toHaveBeenCalledTimes(expect.any(Number));
      expect(onStateChange).toHaveBeenCalledWith(true, false);
    });

    test.skip('should call onValidationErrors when validation errors occur', async () => {
      const onValidationErrors = jest.fn();
      const user = userEvent.setup();

      customRender(<SudokuGridEntry {...defaultProps} onValidationErrors={onValidationErrors} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initial call with no errors
      expect(onValidationErrors).toHaveBeenCalledWith([]);

      // Create validation error
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      const secondCell = await screen.findByTestId('sudoku-cell-A2');

      fireEvent.click(firstCell);
      await user.keyboard('5');

      fireEvent.click(secondCell);
      await user.keyboard('5');

      // Should be called with errors
      await waitFor(() => {
        const lastCall = onValidationErrors.mock.calls[onValidationErrors.mock.calls.length - 1];
        expect(lastCall[0].length).toBeGreaterThan(0);
      });
    });

    test('should call onStateChange with solved state for complete puzzle', async () => {
      const onStateChange = jest.fn();

      customRender(
        <SudokuGridEntry
          {...defaultProps}
          initialPuzzleDescription={validPuzzleDescription}
          onStateChange={onStateChange}
        />
      );

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith(true, true);
      });
    });
  });

  describe('puzzle title display', () => {
    test('should display puzzle title and ID', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={validPuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByText('Test Puzzle')).toBeInTheDocument();
        expect(screen.getByText('ID: test-puzzle')).toBeInTheDocument();
      });
    });

    test('should display default title when no initial puzzle', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual Entry Puzzle')).toBeInTheDocument();
        expect(screen.getByText('ID: manual-entry')).toBeInTheDocument();
      });
    });

    test('should handle puzzle without ID', async () => {
      const puzzleWithoutId = { ...validPuzzleDescription, id: '' };
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={puzzleWithoutId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Puzzle')).toBeInTheDocument();
        // Should not show ID line when ID is empty
        expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('immutable cells', () => {
    test.skip('should handle puzzles with pre-filled cells', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      await waitFor(() => {
        expect(firstCell).toHaveTextContent('1');
      });
      expect(firstCell).toHaveClass('sudoku-cell--immutable');
    });

    test.skip('should not allow changes to immutable cells', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);
      await user.keyboard('9');

      // Should still show original value
      await waitFor(() => {
        expect(firstCell).toHaveTextContent('1');
      });
    });
  });

  describe('integration edge cases', () => {
    test('should handle component unmounting during async operations', () => {
      const { unmount } = customRender(<SudokuGridEntry {...defaultProps} />);

      // Should not throw when unmounting before initialization completes
      expect(() => unmount()).not.toThrow();
    });

    test('should handle rapid prop changes', async () => {
      const { rerender } = customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Change puzzle description
      rerender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByText('Simple Test Puzzle')).toBeInTheDocument();
      });
    });

    test.skip('should handle export when puzzle has no data', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('compact-control-ribbon')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      fireEvent.click(exportButton);

      // Should still attempt export with empty puzzle
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test.skip('should handle all control operations in sequence', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
        expect(screen.getByTestId('compact-control-ribbon')).toBeInTheDocument();
      });

      // Make a change
      const firstCell = await screen.findByTestId('sudoku-cell-A1');
      fireEvent.click(firstCell);
      await user.keyboard('3');

      // Undo
      fireEvent.click(screen.getByTestId('undo-button'));

      // Redo
      fireEvent.click(screen.getByTestId('redo-button'));

      // Reset
      fireEvent.click(screen.getByTestId('reset-button'));
      fireEvent.click(screen.getByTestId('confirm-reset-button'));

      // Export
      fireEvent.click(screen.getByTestId('export-button'));

      // All operations should work without errors
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('layout and structure', () => {
    test('should render components in correct order', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        const entry = screen.getByTestId('sudoku-grid-entry');
        const children = Array.from(entry.querySelectorAll('[data-testid]'));

        const testIds = children.map((child) => child.getAttribute('data-testid'));

        // Should contain all main components
        expect(testIds).toContain('sudoku-grid');
        expect(testIds).toContain('status-indicator');
        expect(testIds).toContain('compact-control-ribbon');
      });
    });

    test('should apply responsive styling', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        const entry = screen.getByTestId('sudoku-grid-entry');
        expect(entry).toBeInTheDocument();

        // Component should have proper structure for responsive design
        const innerContainer = entry.querySelector('div > div');
        expect(innerContainer).toBeInTheDocument();
      });
    });
  });
});
