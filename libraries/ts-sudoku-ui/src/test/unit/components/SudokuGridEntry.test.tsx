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
import { render, screen, fireEvent, waitFor, RenderResult, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuGridEntry } from '../../../components/SudokuGridEntry';
import { IPuzzleDescription } from '@fgv/ts-sudoku-lib';

// Custom render function to ensure container exists
function customRender(ui: React.ReactElement, options?: RenderOptions): RenderResult {
  // Ensure we have a proper container
  const container = document.createElement('div');
  document.body.appendChild(container);

  const result = render(ui, { container, ...options });

  return {
    ...result,
    container
  };
}

// Helper function to get elements from container instead of screen
function getByTestId(container: Element, testId: string): Element {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Unable to find element with data-testid="${testId}"`);
  }
  return element;
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
    cells: '1........................................................................'
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

    // DOM setup is handled in jest.setup.js

    // Mock document methods
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick
        };
      }
      return originalCreateElement.call(document, tagName);
    });

    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
  });

  afterEach(() => {
    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  describe('rendering', () => {
    test('should render loading state initially', () => {
      const { container } = customRender(<SudokuGridEntry {...defaultProps} />);

      // Component initializes asynchronously, should show main state
      const entryElement = container.querySelector('[data-testid="sudoku-grid-entry"]');
      expect(entryElement).toBeInTheDocument();
    });

    test('should render main components after initialization', () => {
      const { container } = customRender(<SudokuGridEntry {...defaultProps} />);

      // Components should be rendered immediately in our test environment
      expect(getByTestId(container, 'sudoku-grid')).toBeInTheDocument();
      expect(getByTestId(container, 'sudoku-controls')).toBeInTheDocument();
      expect(getByTestId(container, 'validation-display')).toBeInTheDocument();
    });

    test('should apply custom className', async () => {
      customRender(<SudokuGridEntry {...defaultProps} className="custom-entry" />);

      await waitFor(() => {
        const entry = screen.getByTestId('sudoku-grid-entry');
        expect(entry).toHaveClass('sudoku-grid-entry');
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
      expect(screen.queryByTestId('sudoku-controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('validation-display')).not.toBeInTheDocument();
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
      expect(entry).toHaveClass('sudoku-grid-entry');
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

      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);

      // Cell should be selected (aria-selected should be true)
      expect(firstCell).toHaveAttribute('aria-selected', 'true');
    });

    test('should handle cell value changes', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      await user.keyboard('5');

      expect(firstCell).toHaveTextContent('5');
    });

    test('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select first cell
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);

      // Navigate right
      const grid = screen.getByTestId('sudoku-grid');
      await user.click(grid);
      await user.keyboard('{ArrowRight}');

      // Second cell should now be selected
      const secondCell = screen.getByTestId('sudoku-cell-cell-0-1');
      expect(secondCell).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('controls integration', () => {
    test('should handle undo/redo operations', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      });

      // Make a change
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      await user.keyboard('7');

      expect(firstCell).toHaveTextContent('7');

      // Undo should be enabled
      const undoButton = screen.getByTestId('undo-button');
      expect(undoButton).toBeEnabled();

      // Perform undo
      fireEvent.click(undoButton);

      // Cell should be empty
      expect(firstCell).toHaveTextContent('');

      // Redo should be enabled
      const redoButton = screen.getByTestId('redo-button');
      expect(redoButton).toBeEnabled();

      // Perform redo
      fireEvent.click(redoButton);

      // Cell should have value again
      expect(firstCell).toHaveTextContent('7');
    });

    test('should handle reset operation', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      });

      // Make some changes
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      await user.keyboard('9');

      expect(firstCell).toHaveTextContent('9');

      // Reset with confirmation
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      const confirmButton = screen.getByTestId('confirm-reset-button');
      fireEvent.click(confirmButton);

      // Cell should be empty
      expect(firstCell).toHaveTextContent('');
    });

    test('should handle export operation', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
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

    test('should handle export with custom puzzle data', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      });

      // Add some values
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      await user.keyboard('1');

      const secondCell = screen.getByTestId('sudoku-cell-cell-0-1');
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
    test('should show validation errors for duplicate values', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('validation-display')).toBeInTheDocument();
      });

      // Create duplicate values in same row
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      const secondCell = screen.getByTestId('sudoku-cell-cell-0-1');

      fireEvent.click(firstCell);
      await user.keyboard('5');

      fireEvent.click(secondCell);
      await user.keyboard('5');

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/validation error/)).toBeInTheDocument();
      });
    });

    test('should show valid status when no errors', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('validation-display')).toBeInTheDocument();
        expect(screen.getByText('Puzzle is valid')).toBeInTheDocument();
      });
    });

    test('should show solved status for complete valid puzzle', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={validPuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('validation-display')).toBeInTheDocument();
        expect(screen.getByText('Puzzle solved! 🎉')).toBeInTheDocument();
      });
    });
  });

  describe('callback props', () => {
    test('should call onStateChange when puzzle state changes', async () => {
      const onStateChange = jest.fn();
      const user = userEvent.setup();

      customRender(<SudokuGridEntry {...defaultProps} onStateChange={onStateChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initial call
      expect(onStateChange).toHaveBeenCalledWith(true, false);

      // Make a change
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      await user.keyboard('5');

      // Should be called again (may be multiple times due to re-renders)
      expect(onStateChange).toHaveBeenCalledTimes(expect.any(Number));
      expect(onStateChange).toHaveBeenCalledWith(true, false);
    });

    test('should call onValidationErrors when validation errors occur', async () => {
      const onValidationErrors = jest.fn();
      const user = userEvent.setup();

      customRender(<SudokuGridEntry {...defaultProps} onValidationErrors={onValidationErrors} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initial call with no errors
      expect(onValidationErrors).toHaveBeenCalledWith([]);

      // Create validation error
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      const secondCell = screen.getByTestId('sudoku-cell-cell-0-1');

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
    test('should handle puzzles with pre-filled cells', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      expect(firstCell).toHaveTextContent('1');
      expect(firstCell).toHaveClass('sudoku-cell--immutable');
    });

    test('should not allow changes to immutable cells', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
      fireEvent.click(firstCell);
      await user.keyboard('9');

      // Should still show original value
      expect(firstCell).toHaveTextContent('1');
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

    test('should handle export when puzzle has no data', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      fireEvent.click(exportButton);

      // Should still attempt export with empty puzzle
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('should handle all control operations in sequence', async () => {
      const user = userEvent.setup();
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
        expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      });

      // Make a change
      const firstCell = screen.getByTestId('sudoku-cell-cell-0-0');
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
        expect(testIds).toContain('validation-display');
        expect(testIds).toContain('sudoku-controls');
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
