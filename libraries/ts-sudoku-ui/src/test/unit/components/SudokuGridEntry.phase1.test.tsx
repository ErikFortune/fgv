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
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuGridEntry } from '../../../components/SudokuGridEntry';
import {
  customRender,
  renderWithMobilePortrait,
  renderWithDesktop,
  mockMatchMedia,
  setWindowDimensions,
  validPuzzleDescription,
  simplePuzzleDescription,
  sudokuXPuzzleDescription,
  invalidPuzzleDescription,
  defaultProps
} from './SudokuGridEntry.testHelpers';

describe('SudokuGridEntry - Phase 1: Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = mockMatchMedia;

    // Default to desktop dimensions (tests that need mobile will override)
    setWindowDimensions(1024, 768);
  });

  describe('Component Initialization and Rendering', () => {
    test('should render main components after initialization', () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      expect(screen.getByTestId('sudoku-grid-entry')).toBeInTheDocument();
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

    test('should handle puzzle without ID', async () => {
      const puzzleWithoutId = { ...validPuzzleDescription, id: '' };
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={puzzleWithoutId} />);

      await waitFor(() => {
        expect(screen.getByText('Test Puzzle')).toBeInTheDocument();
        expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
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

  describe('Multi-Select Functionality', () => {
    test('should support Ctrl+click multi-select', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');

      // First click selects cell
      fireEvent.click(firstCell);
      expect(firstCell).toHaveAttribute('aria-selected', 'true');

      // Ctrl+click adds to selection
      fireEvent.click(secondCell, { ctrlKey: true });
      expect(firstCell).toHaveAttribute('aria-selected', 'true');
      expect(secondCell).toHaveAttribute('aria-selected', 'true');

      // Should show multi-select hint
      expect(screen.getByText(/2 cells selected/)).toBeInTheDocument();
    });

    test('should support Meta+click multi-select (Mac)', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');
      const thirdCell = screen.getByTestId('sudoku-cell-A3');

      // First click selects cell
      fireEvent.click(firstCell);

      // Meta+click adds to selection
      fireEvent.click(secondCell, { metaKey: true });
      fireEvent.click(thirdCell, { metaKey: true });

      expect(screen.getByText(/3 cells selected/)).toBeInTheDocument();
    });

    test('should remove cell from multi-selection with Ctrl+click on selected cell', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');
      const thirdCell = screen.getByTestId('sudoku-cell-A3');

      // Select three cells
      fireEvent.click(firstCell);
      fireEvent.click(secondCell, { ctrlKey: true });
      fireEvent.click(thirdCell, { ctrlKey: true });

      expect(screen.getByText(/3 cells selected/)).toBeInTheDocument();

      // Ctrl+click on already selected cell removes it
      fireEvent.click(secondCell, { ctrlKey: true });

      expect(screen.getByText(/2 cells selected/)).toBeInTheDocument();
      expect(firstCell).toHaveAttribute('aria-selected', 'true');
      expect(secondCell).toHaveAttribute('aria-selected', 'false');
      expect(thirdCell).toHaveAttribute('aria-selected', 'true');
    });

    test('should clear multi-selection when clicking cell without modifier', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');
      const thirdCell = screen.getByTestId('sudoku-cell-A3');

      // Create multi-selection
      fireEvent.click(firstCell);
      fireEvent.click(secondCell, { ctrlKey: true });
      fireEvent.click(thirdCell, { ctrlKey: true });

      expect(screen.getByText(/3 cells selected/)).toBeInTheDocument();

      // Click without modifier clears multi-selection
      const fourthCell = screen.getByTestId('sudoku-cell-A4');
      fireEvent.click(fourthCell);

      expect(screen.queryByText(/cells selected/)).not.toBeInTheDocument();
      expect(fourthCell).toHaveAttribute('aria-selected', 'true');
      expect(firstCell).toHaveAttribute('aria-selected', 'false');
    });

    test('should update primary selected cell when removing current primary from multi-selection', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');

      // Select two cells
      fireEvent.click(firstCell);
      fireEvent.click(secondCell, { ctrlKey: true });

      // Second cell should be primary (last selected)
      expect(secondCell).toHaveAttribute('aria-selected', 'true');

      // Remove primary cell
      fireEvent.click(secondCell, { ctrlKey: true });

      // First cell should still be selected
      expect(firstCell).toHaveAttribute('aria-selected', 'true');
      expect(screen.queryByText(/cells selected/)).not.toBeInTheDocument();
    });

    test('should display multi-select hint for traditional input', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');

      // Select two cells
      fireEvent.click(firstCell);
      fireEvent.click(secondCell, { ctrlKey: true });

      // Should show multi-select hint
      const hint = screen.getByText(/2 cells selected/);
      expect(hint).toBeInTheDocument();
    });
  });

  describe('Puzzle Type Support', () => {
    test('should render standard sudoku puzzle', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
        expect(screen.getByText('Simple Test Puzzle')).toBeInTheDocument();
      });
    });

    test('should render Sudoku-X puzzle', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={sudokuXPuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
        expect(screen.getByText('Sudoku-X Test Puzzle')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Responsive Behavior', () => {
    test('should render with responsive layout classes', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        const entry = screen.getByTestId('sudoku-grid-entry');
        expect(entry).toHaveClass('w-full', 'min-h-screen');
      });
    });

    test('should show input mode toggle for traditional input', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Input Mode:')).toBeInTheDocument();
        expect(screen.getByText(/Notes \(Default\)/)).toBeInTheDocument();
        expect(screen.getByText(/Values \(Hold Shift/)).toBeInTheDocument();
      });
    });

    test('should switch input modes', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Input Mode:')).toBeInTheDocument();
      });

      const valueButton = screen.getByText(/Values \(Hold Shift/);
      fireEvent.click(valueButton);

      // Value button should now be highlighted
      expect(valueButton).toHaveClass('bg-blue-500', 'text-white');
    });

    test('should show help text for traditional input', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Notes-First Input System:')).toBeInTheDocument();
        expect(screen.getByText(/Numbers add\/remove notes by default/)).toBeInTheDocument();
      });
    });

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
  });

  describe('State Change Callbacks', () => {
    test('should call onStateChange when puzzle state changes', async () => {
      const onStateChange = jest.fn();

      customRender(<SudokuGridEntry {...defaultProps} onStateChange={onStateChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initial call
      expect(onStateChange).toHaveBeenCalledWith(true, false);
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

    test('should call onValidationErrors on initialization', async () => {
      const onValidationErrors = jest.fn();

      customRender(<SudokuGridEntry {...defaultProps} onValidationErrors={onValidationErrors} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initial call with no errors
      expect(onValidationErrors).toHaveBeenCalledWith([]);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
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

    test('should clear selection when all cells removed from multi-select', async () => {
      customRender(<SudokuGridEntry {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const firstCell = screen.getByTestId('sudoku-cell-A1');
      const secondCell = screen.getByTestId('sudoku-cell-A2');

      // Select two cells
      fireEvent.click(firstCell);
      fireEvent.click(secondCell, { ctrlKey: true });

      expect(screen.getByText(/2 cells selected/)).toBeInTheDocument();

      // Remove both cells
      fireEvent.click(firstCell, { ctrlKey: true });
      fireEvent.click(secondCell, { ctrlKey: true });

      // No cells should be selected
      expect(screen.queryByText(/cells selected/)).not.toBeInTheDocument();
      expect(firstCell).toHaveAttribute('aria-selected', 'false');
      expect(secondCell).toHaveAttribute('aria-selected', 'false');
    });
  });

  // ============================================================================
  // PHASE 1: Core User Interactions
  // ============================================================================

  describe('Phase 1.1: Cell Value Entry', () => {
    test('should update single cell value when cell is selected and value entered in value mode', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Switch to value mode
      const valueButton = screen.getByText(/Values \(Hold Shift/);
      fireEvent.click(valueButton);

      // Select an empty cell (A2 - all except A1 are empty in simplePuzzleDescription)
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Simulate keyboard input for value entry (number 5)
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5' });

      // Verify cell displays the value
      await waitFor(() => {
        expect(cell).toHaveTextContent('5');
      });
    });

    test('should enter value with Shift modifier key regardless of current mode', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Stay in notes mode (default)
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Enter value with Shift key (overrides notes mode)
      fireEvent.keyDown(cell, { key: '8', code: 'Digit8', shiftKey: true });

      // Verify cell displays the value, not a note
      await waitFor(() => {
        expect(cell).toHaveTextContent('8');
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/Row 1, Column 2, 8$/));
      });
    });

    test('should clear cell value using Backspace', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // First, add a value to cell A2
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('5');
      });

      // Now clear value using Backspace
      fireEvent.keyDown(cell, { key: 'Backspace', code: 'Backspace' });

      // Verify cell is empty
      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should not modify given (immutable) cells', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Cell A1 has value '1' which is a given value
      const cell = screen.getByTestId('sudoku-cell-A1');
      fireEvent.click(cell);

      // Verify it's marked as immutable
      expect(cell).toHaveAttribute('data-immutable', 'true');

      // Try to change the value
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5', shiftKey: true });

      // Verify cell still has original value
      expect(cell).toHaveTextContent('1');
    });
  });

  describe('Phase 1.2: Note Management', () => {
    test('should add note to single selected cell in notes mode', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select an empty cell
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Notes mode is default, so keyboard number should add a note
      fireEvent.keyDown(cell, { key: '3', code: 'Digit3' });

      // Verify note appears in cell (check aria-label)
      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/notes: 3/));
      });

      // Also verify the note is visually rendered
      const noteText = cell.querySelector('span:not([class*="font-inherit"])');
      expect(noteText).toHaveTextContent('3');
    });

    test('should remove note when toggling existing note in single cell', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Add a note
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5' });

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/notes: 5/));
      });

      // Toggle the same note again to remove it
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5' });

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should add note to all selected cells when SOME have it (normalize logic)', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select three cells
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');
      const cellA4 = screen.getByTestId('sudoku-cell-A4');

      // First, add note 4 to just cellA2
      fireEvent.click(cellA2);
      fireEvent.keyDown(cellA2, { key: '4', code: 'Digit4' });

      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 4/));
      });

      // Now select all three cells
      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });
      fireEvent.click(cellA4, { ctrlKey: true });

      expect(screen.getByText(/3 cells selected/)).toBeInTheDocument();

      // Toggle note 4 - should add to all because SOME (only cellA2) have it
      fireEvent.keyDown(cellA2, { key: '4', code: 'Digit4' });

      // Verify all cells now have note 4
      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 4/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 4/));
        expect(cellA4).toHaveAttribute('aria-label', expect.stringMatching(/notes: 4/));
      });
    });

    test('should remove note from all selected cells when ALL have it', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select three cells
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');
      const cellA4 = screen.getByTestId('sudoku-cell-A4');

      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });
      fireEvent.click(cellA4, { ctrlKey: true });

      // Add note 6 to all cells
      fireEvent.keyDown(cellA2, { key: '6', code: 'Digit6' });

      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 6/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 6/));
        expect(cellA4).toHaveAttribute('aria-label', expect.stringMatching(/notes: 6/));
      });

      // Toggle note 6 again - should remove from all because ALL have it
      fireEvent.keyDown(cellA2, { key: '6', code: 'Digit6' });

      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA4).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should clear all notes from cell using key 0', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Add multiple notes
      fireEvent.keyDown(cell, { key: '2', code: 'Digit2' });
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5' });
      fireEvent.keyDown(cell, { key: '8', code: 'Digit8' });

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/notes: 2, 5, 8/));
      });

      // Clear all notes using key 0
      fireEvent.keyDown(cell, { key: '0', code: 'Digit0' });

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should clear all notes from cell using Delete key', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Add some notes
      fireEvent.keyDown(cell, { key: '3', code: 'Digit3' });
      fireEvent.keyDown(cell, { key: '7', code: 'Digit7' });

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/notes: 3, 7/));
      });

      // Clear all notes using Delete key
      fireEvent.keyDown(cell, { key: 'Delete', code: 'Delete' });

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should clear all notes from multiple selected cells via double-tap', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');
      const cellA4 = screen.getByTestId('sudoku-cell-A4');

      // Select multiple cells
      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });
      fireEvent.click(cellA4, { ctrlKey: true });

      // Add notes to all three cells
      fireEvent.keyDown(cellA2, { key: '2', code: 'Digit2' });
      fireEvent.keyDown(cellA2, { key: '5', code: 'Digit5' });

      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 2, 5/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 2, 5/));
        expect(cellA4).toHaveAttribute('aria-label', expect.stringMatching(/notes: 2, 5/));
      });

      // Double-tap on one of the selected cells to clear all notes from all selected cells
      const now = Date.now();
      fireEvent.click(cellA2);
      // Simulate double-tap within 300ms
      jest.spyOn(Date, 'now').mockReturnValue(now + 200);
      fireEvent.click(cellA2);

      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA4).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });

      // Restore Date.now
      jest.restoreAllMocks();
    });
  });

  describe('Phase 1.3: Keypad Interactions', () => {
    test('should enter note via keypad when in notes mode', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      renderWithMobilePortrait(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select a cell
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Click number 4 on notes keypad (notes mode is default)
      const noteButton = screen.getByTestId('keypad-notes-4');
      fireEvent.click(noteButton);

      // Verify note was added
      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/notes: 4/));
      });
    });

    test('should enter value via keypad when in value mode', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      renderWithMobilePortrait(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Switch to value mode by clicking the value keypad's title area
      // In mobile view, there's no separate mode toggle - each keypad is always visible

      // Select a cell
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);

      // Click number 6 on value keypad
      const keypadButton = screen.getByTestId('keypad-values-6');
      fireEvent.click(keypadButton);

      // Verify value was entered
      await waitFor(() => {
        expect(cell).toHaveTextContent('6');
      });
    });

    test('should apply note to all selected cells via keypad', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      renderWithMobilePortrait(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select multiple cells
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');
      const cellA4 = screen.getByTestId('sudoku-cell-A4');

      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });
      fireEvent.click(cellA4, { ctrlKey: true });

      // Verify multi-selection (text appears in multiple places in mobile view)
      expect(screen.getAllByText(/3 cells selected/).length).toBeGreaterThan(0);

      // Click number 7 on notes keypad
      const noteButton = screen.getByTestId('keypad-notes-7');
      fireEvent.click(noteButton);

      // Verify all cells have the note
      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 7/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 7/));
        expect(cellA4).toHaveAttribute('aria-label', expect.stringMatching(/notes: 7/));
      });
    });

    test('should apply value to all selected cells via keypad', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      renderWithMobilePortrait(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select multiple cells
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');
      const cellA4 = screen.getByTestId('sudoku-cell-A4');

      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });
      fireEvent.click(cellA4, { ctrlKey: true });

      // Verify multi-selection (text appears in multiple places in mobile view)
      expect(screen.getAllByText(/3 cells selected/).length).toBeGreaterThan(0);

      // Click number 9 on value keypad
      const valueButton = screen.getByTestId('keypad-values-9');
      fireEvent.click(valueButton);

      // Verify all cells have the value
      await waitFor(() => {
        expect(cellA2).toHaveTextContent('9');
        expect(cellA3).toHaveTextContent('9');
        expect(cellA4).toHaveTextContent('9');
      });
    });

    test('should clear notes from all selected cells via keypad', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      renderWithMobilePortrait(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select cells and add notes
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');

      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });

      // Add some notes via keypad
      const note2 = screen.getByTestId('keypad-notes-2');
      const note5 = screen.getByTestId('keypad-notes-5');
      fireEvent.click(note2);
      fireEvent.click(note5);

      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 2, 5/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 2, 5/));
      });

      // Clear notes using keypad clear button
      const clearButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.click(clearButton);

      // Verify all cells have notes cleared
      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should clear values from all selected cells via keypad', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      renderWithMobilePortrait(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Select cells and add values
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');

      fireEvent.click(cellA2);
      fireEvent.click(cellA3, { ctrlKey: true });

      // Add values via keypad
      const value3 = screen.getByTestId('keypad-values-3');
      fireEvent.click(value3);

      await waitFor(() => {
        expect(cellA2).toHaveTextContent('3');
        expect(cellA3).toHaveTextContent('3');
      });

      // Clear values using keypad clear button
      const clearButton = screen.getByTestId('keypad-values-clear');
      fireEvent.click(clearButton);

      // Verify all cells have values cleared
      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should switch input mode via mode toggle buttons on desktop', async () => {
      // Desktop layout ensures mode toggle buttons are visible (hidden keypad mode)
      renderWithDesktop(
        <SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Notes mode is default - notes button should be highlighted
      const notesButton = screen.getByText(/Notes \(Default\)/);
      const valuesButton = screen.getByText(/Values \(Hold Shift/);

      expect(notesButton).toHaveClass('bg-blue-500', 'text-white');
      expect(valuesButton).not.toHaveClass('bg-blue-500');

      // Switch to value mode
      fireEvent.click(valuesButton);

      await waitFor(() => {
        expect(valuesButton).toHaveClass('bg-blue-500', 'text-white');
        expect(notesButton).not.toHaveClass('bg-blue-500');
      });

      // Switch back to notes mode
      fireEvent.click(notesButton);

      await waitFor(() => {
        expect(notesButton).toHaveClass('bg-blue-500', 'text-white');
        expect(valuesButton).not.toHaveClass('bg-blue-500');
      });
    });
  });

  describe('Phase 1.4: Undo/Redo/Reset Operations', () => {
    test('should undo last cell value change', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Initially, undo should be disabled
      const undoButton = screen.getByTestId('compact-undo-button');
      expect(undoButton).toBeDisabled();

      // Make a change - enter a value
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('5');
      });

      // Undo should now be enabled
      await waitFor(() => {
        expect(undoButton).not.toBeDisabled();
      });

      // Click undo
      fireEvent.click(undoButton);

      // Value should be reverted
      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });

      // Undo should be disabled again
      expect(undoButton).toBeDisabled();
    });

    test('should redo undone operation', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const redoButton = screen.getByTestId('compact-redo-button');
      const undoButton = screen.getByTestId('compact-undo-button');

      // Initially, redo should be disabled
      expect(redoButton).toBeDisabled();

      // Make a change
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);
      fireEvent.keyDown(cell, { key: '7', code: 'Digit7', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('7');
      });

      // Undo the change
      fireEvent.click(undoButton);

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });

      // Redo should now be enabled
      await waitFor(() => {
        expect(redoButton).not.toBeDisabled();
      });

      // Click redo
      fireEvent.click(redoButton);

      // Value should be restored
      await waitFor(() => {
        expect(cell).toHaveTextContent('7');
      });

      // Redo should be disabled again (no more to redo)
      expect(redoButton).toBeDisabled();
    });

    test('should reset puzzle to initial state with confirmation', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Make several changes
      const cellA2 = screen.getByTestId('sudoku-cell-A2');
      const cellA3 = screen.getByTestId('sudoku-cell-A3');

      fireEvent.click(cellA2);
      fireEvent.keyDown(cellA2, { key: '5', code: 'Digit5', shiftKey: true });

      await waitFor(() => {
        expect(cellA2).toHaveTextContent('5');
      });

      fireEvent.click(cellA3);
      fireEvent.keyDown(cellA3, { key: '8', code: 'Digit8', shiftKey: true });

      await waitFor(() => {
        expect(cellA3).toHaveTextContent('8');
      });

      // Click reset button (first click shows confirmation)
      const resetButton = screen.getByTestId('compact-reset-button');
      fireEvent.click(resetButton);

      // Confirmation buttons should appear
      await waitFor(() => {
        expect(screen.getByTestId('compact-confirm-reset-button')).toBeInTheDocument();
        expect(screen.getByTestId('compact-cancel-reset-button')).toBeInTheDocument();
      });

      // Click confirm
      const confirmButton = screen.getByTestId('compact-confirm-reset-button');
      fireEvent.click(confirmButton);

      // Puzzle should be reset - cells should be empty
      await waitFor(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });
    });

    test('should cancel reset when cancel button is clicked', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Make a change
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);
      fireEvent.keyDown(cell, { key: '9', code: 'Digit9', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('9');
      });

      // Click reset button (shows confirmation)
      const resetButton = screen.getByTestId('compact-reset-button');
      fireEvent.click(resetButton);

      // Click cancel
      await waitFor(() => {
        const cancelButton = screen.getByTestId('compact-cancel-reset-button');
        fireEvent.click(cancelButton);
      });

      // Confirmation should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('compact-confirm-reset-button')).not.toBeInTheDocument();
      });

      // Cell should still have the value
      expect(cell).toHaveTextContent('9');
    });

    test('should disable undo button when no history available', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const undoButton = screen.getByTestId('compact-undo-button');

      // Should be disabled initially (no changes made)
      expect(undoButton).toBeDisabled();
    });

    test('should disable redo button when no undone actions available', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const redoButton = screen.getByTestId('compact-redo-button');

      // Should be disabled initially (nothing to redo)
      expect(redoButton).toBeDisabled();
    });

    test('should handle multiple undo/redo operations', async () => {
      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const cell = screen.getByTestId('sudoku-cell-A2');
      const undoButton = screen.getByTestId('compact-undo-button');
      const redoButton = screen.getByTestId('compact-redo-button');

      // Make first change
      fireEvent.click(cell);
      fireEvent.keyDown(cell, { key: '3', code: 'Digit3', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('3');
      });

      // Make second change
      fireEvent.keyDown(cell, { key: '6', code: 'Digit6', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('6');
      });

      // Undo first time (back to 3)
      fireEvent.click(undoButton);

      await waitFor(() => {
        expect(cell).toHaveTextContent('3');
      });

      // Undo second time (back to empty)
      fireEvent.click(undoButton);

      await waitFor(() => {
        expect(cell).toHaveAttribute('aria-label', expect.stringMatching(/empty$/));
      });

      // Redo first time (back to 3)
      fireEvent.click(redoButton);

      await waitFor(() => {
        expect(cell).toHaveTextContent('3');
      });

      // Redo second time (back to 6)
      fireEvent.click(redoButton);

      await waitFor(() => {
        expect(cell).toHaveTextContent('6');
      });
    });
  });

  describe('Phase 1.5: Export Functionality', () => {
    test('should trigger file download when export button is clicked', async () => {
      // Mock DOM APIs for file download
      const createObjectURLMock = jest.fn(() => 'blob:mock-url');
      const revokeObjectURLMock = jest.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByTestId('compact-export-button');
      fireEvent.click(exportButton);

      // Verify DOM APIs were called
      await waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
      });

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    test('should create blob with puzzle data when export button is clicked', async () => {
      // Mock DOM APIs
      const createObjectURLMock = jest.fn(() => 'blob:mock-url');
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = jest.fn();

      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Make some changes to the puzzle
      const cell = screen.getByTestId('sudoku-cell-A2');
      fireEvent.click(cell);
      fireEvent.keyDown(cell, { key: '5', code: 'Digit5', shiftKey: true });

      await waitFor(() => {
        expect(cell).toHaveTextContent('5');
      });

      // Export
      const exportButton = screen.getByTestId('compact-export-button');
      fireEvent.click(exportButton);

      // Verify a Blob was created
      await waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalled();
        const calls = createObjectURLMock.mock.calls as unknown as Blob[][];
        expect(calls.length).toBeGreaterThan(0);
        const firstCall = calls[0];
        expect(firstCall[0]).toBeInstanceOf(Blob);
        expect(firstCall[0].type).toBe('application/json');
      });
    });

    test('should include puzzle ID in exported filename', async () => {
      // Mock DOM APIs and capture download attribute
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      let capturedDownloadAttr: string | null = null;
      const linkClickSpy = jest.fn();

      // Save original createElement
      const originalCreateElement = document.createElement.bind(document);

      // Mock createElement to intercept link creation
      document.createElement = jest.fn((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          // Override the download property setter
          let downloadValue = '';
          Object.defineProperty(element, 'download', {
            set: (value: string) => {
              downloadValue = value;
              capturedDownloadAttr = value;
            },
            get: () => downloadValue,
            configurable: true
          });
          // Spy on click
          element.click = linkClickSpy;
        }
        return element;
      });

      customRender(<SudokuGridEntry {...defaultProps} initialPuzzleDescription={simplePuzzleDescription} />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      // Export
      const exportButton = screen.getByTestId('compact-export-button');
      fireEvent.click(exportButton);

      // Verify filename was set correctly
      await waitFor(() => {
        expect(capturedDownloadAttr).toBe('simple-puzzle.json');
        expect(linkClickSpy).toHaveBeenCalled();
      });

      // Restore
      document.createElement = originalCreateElement;
    });
  });
});
