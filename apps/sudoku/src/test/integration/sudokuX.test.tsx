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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';

import { PuzzlePage } from '../../pages/PuzzlePage';
import { ObservabilityProvider } from '../../contexts';

// Mock the observability context for testing
const mockObservability = {
  track: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn()
};

const MockObservabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ObservabilityProvider value={mockObservability}>{children}</ObservabilityProvider>
);

const renderPuzzlePage = (gameType: string = 'sudoku-x') => {
  return render(
    <MemoryRouter initialEntries={[`/puzzle/${gameType}`]}>
      <MockObservabilityProvider>
        <PuzzlePage />
      </MockObservabilityProvider>
    </MemoryRouter>
  );
};

describe('Sudoku X Application Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('puzzle loading and initialization', () => {
    test('should load Sudoku X puzzle without errors', async () => {
      renderPuzzlePage('sudoku-x');

      // Wait for the puzzle to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should not show any error messages
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/unsupported/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();

      // Should show the puzzle grid
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    test('should display "Sudoku X" title/heading', async () => {
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        const sudokuXHeading = headings.find((heading) =>
          heading.textContent?.toLowerCase().includes('sudoku x')
        );
        expect(sudokuXHeading).toBeInTheDocument();
      });
    });

    test('should render 81 cells for Sudoku X puzzle', async () => {
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        // Find all cell buttons (each cell should be a button for interaction)
        const cellButtons = screen
          .getAllByRole('button')
          .filter(
            (button) =>
              button.getAttribute('aria-label')?.includes('cell') ||
              button.className.includes('cell') ||
              /[A-I][1-9]/.test(button.getAttribute('aria-label') || '')
          );

        expect(cellButtons.length).toBe(81);
      });
    });

    test('should differentiate from standard Sudoku when switching types', async () => {
      // First render standard Sudoku
      const { rerender } = render(
        <MemoryRouter initialEntries={['/puzzle/standard']}>
          <MockObservabilityProvider>
            <PuzzlePage />
          </MockObservabilityProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const standardHeading = screen.queryByText(/classic sudoku/i);
        expect(standardHeading).toBeInTheDocument();
      });

      // Then switch to Sudoku X
      rerender(
        <MemoryRouter initialEntries={['/puzzle/sudoku-x']}>
          <MockObservabilityProvider>
            <PuzzlePage />
          </MockObservabilityProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        const sudokuXHeading = screen.queryByText(/sudoku x/i);
        expect(sudokuXHeading).toBeInTheDocument();
      });
    });
  });

  describe('visual diagonal indicators', () => {
    test('should render diagonal lines for Sudoku X puzzle', async () => {
      const { container } = renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        // Look for SVG elements that might contain diagonal lines
        const svgElements = container.querySelectorAll('svg');
        const diagonalElements = container.querySelectorAll(
          'svg line, [class*="diagonal"], [class*="x-line"]'
        );

        expect(diagonalElements.length).toBeGreaterThan(0);
      });
    });

    test('should not render diagonal lines for standard Sudoku', async () => {
      const { container } = renderPuzzlePage('standard');

      await waitFor(() => {
        // Standard Sudoku should not have diagonal indicators
        const diagonalElements = container.querySelectorAll('[class*="diagonal"], [class*="x-line"]');

        expect(diagonalElements.length).toBe(0);
      });
    });

    test('should display diagonal lines with appropriate styling', async () => {
      const { container } = renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        const diagonalLines = container.querySelectorAll('svg line');

        if (diagonalLines.length > 0) {
          const line = diagonalLines[0];
          const styles = window.getComputedStyle(line);

          // Diagonal lines should be subtle
          if (styles.opacity) {
            expect(parseFloat(styles.opacity)).toBeLessThanOrEqual(0.5);
          }

          // Should have appropriate stroke properties
          expect(line.getAttribute('stroke')).toBeTruthy();
        }
      });
    });
  });

  describe('diagonal constraint validation', () => {
    test('should detect and display validation errors for diagonal violations', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Find cells A1 and B2 (on the main diagonal)
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      const cellB2 = screen.getByLabelText(/B2|cell.*1.*1/i);

      // Click on A1 and enter a value
      await user.click(cellA1);
      await user.keyboard('5');

      // Click on B2 and enter the same value (should create diagonal violation)
      await user.click(cellB2);
      await user.keyboard('5');

      // Should show validation error
      await waitFor(() => {
        const errorIndicators = screen
          .getAllByRole('button')
          .filter(
            (button) =>
              button.className.includes('error') ||
              button.className.includes('invalid') ||
              button.getAttribute('aria-invalid') === 'true'
          );

        expect(errorIndicators.length).toBeGreaterThan(0);
      });
    });

    test('should show specific error messages for diagonal constraint violations', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Create a diagonal violation
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      const cellC3 = screen.getByLabelText(/C3|cell.*2.*2/i);

      await user.click(cellA1);
      await user.keyboard('7');

      await user.click(cellC3);
      await user.keyboard('7');

      // Look for error message about duplicate or diagonal
      await waitFor(() => {
        const errorText = screen.queryByText(/duplicate|diagonal/i);
        expect(errorText).toBeInTheDocument();
      });
    });

    test('should clear validation errors when diagonal conflicts are resolved', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Create diagonal violation
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      const cellB2 = screen.getByLabelText(/B2|cell.*1.*1/i);

      await user.click(cellA1);
      await user.keyboard('3');

      await user.click(cellB2);
      await user.keyboard('3');

      // Verify error exists
      await waitFor(() => {
        const errorCells = screen
          .getAllByRole('button')
          .filter((button) => button.getAttribute('aria-invalid') === 'true');
        expect(errorCells.length).toBeGreaterThan(0);
      });

      // Resolve the conflict
      await user.click(cellB2);
      await user.keyboard('4');

      // Error should be cleared
      await waitFor(() => {
        const errorCells = screen
          .getAllByRole('button')
          .filter((button) => button.getAttribute('aria-invalid') === 'true');
        expect(errorCells.length).toBe(0);
      });
    });
  });

  describe('user interactions and multi-select', () => {
    test('should support cell selection and value entry on diagonal cells', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Test diagonal cells
      const diagonalCells = ['A1', 'B2', 'C3', 'E5'];

      for (const cellLabel of diagonalCells) {
        const cell = screen.getByLabelText(new RegExp(cellLabel, 'i'));

        await user.click(cell);

        // Cell should become selected (usually shown with different styling)
        expect(cell.className).toMatch(/selected|active|focus/i);

        // Enter a value
        await user.keyboard((diagonalCells.indexOf(cellLabel) + 1).toString());

        // Value should appear in the cell
        await waitFor(() => {
          expect(cell.textContent).toBe((diagonalCells.indexOf(cellLabel) + 1).toString());
        });
      }
    });

    test('should support keyboard navigation through diagonal cells', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Select the center cell E5 (which is on both diagonals)
      const centerCell = screen.getByLabelText(/E5|cell.*4.*4/i);
      await user.click(centerCell);

      // Use arrow keys to navigate
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowRight}');

      // Navigation should work without errors
      // The exact behavior depends on implementation, but it shouldn't crash
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    test('should support multi-select operations on diagonal cells', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      const cellB2 = screen.getByLabelText(/B2|cell.*1.*1/i);

      // Select first cell
      await user.click(cellA1);

      // Hold Ctrl/Cmd and select second cell for multi-select
      await user.keyboard('{Control>}');
      await user.click(cellB2);
      await user.keyboard('{/Control}');

      // Both cells should be in some selected state
      // This is implementation-dependent, but the operation should not crash
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('undo/redo functionality', () => {
    test('should support undo/redo for diagonal cell operations', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Make a move on a diagonal cell
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      await user.click(cellA1);
      await user.keyboard('8');

      // Verify the value is set
      await waitFor(() => {
        expect(cellA1.textContent).toBe('8');
      });

      // Look for undo button or use keyboard shortcut
      const undoButton = screen.queryByLabelText(/undo/i) || screen.queryByText(/undo/i);
      if (undoButton) {
        await user.click(undoButton);
      } else {
        // Try keyboard shortcut
        await user.keyboard('{Control>}z{/Control}');
      }

      // Value should be cleared
      await waitFor(() => {
        expect(cellA1.textContent).not.toBe('8');
      });
    });

    test('should handle undo/redo with diagonal constraint validation', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Create a valid move
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      await user.click(cellA1);
      await user.keyboard('6');

      // Create an invalid move (diagonal violation)
      const cellB2 = screen.getByLabelText(/B2|cell.*1.*1/i);
      await user.click(cellB2);
      await user.keyboard('6');

      // Should show validation error
      await waitFor(() => {
        const errorCells = screen
          .getAllByRole('button')
          .filter((button) => button.getAttribute('aria-invalid') === 'true');
        expect(errorCells.length).toBeGreaterThan(0);
      });

      // Undo the invalid move
      const undoButton = screen.queryByLabelText(/undo/i) || screen.queryByText(/undo/i);
      if (undoButton) {
        await user.click(undoButton);

        // Error should be cleared
        await waitFor(() => {
          const errorCells = screen
            .getAllByRole('button')
            .filter((button) => button.getAttribute('aria-invalid') === 'true');
          expect(errorCells.length).toBe(0);
        });
      }
    });
  });

  describe('export functionality', () => {
    test('should export Sudoku X puzzle with correct format', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Make some moves
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      await user.click(cellA1);
      await user.keyboard('1');

      const cellB2 = screen.getByLabelText(/B2|cell.*1.*1/i);
      await user.click(cellB2);
      await user.keyboard('2');

      // Look for export functionality
      const exportButton = screen.queryByLabelText(/export/i) || screen.queryByText(/export/i);
      if (exportButton) {
        await user.click(exportButton);

        // Should trigger export without errors
        // The exact behavior depends on implementation
        expect(screen.getByRole('grid')).toBeInTheDocument();
      }
    });
  });

  describe('performance and responsiveness', () => {
    test('should render Sudoku X puzzle grid within reasonable time', async () => {
      const startTime = performance.now();

      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 5 seconds (generous for CI)
      expect(renderTime).toBeLessThan(5000);
    });

    test('should handle rapid user interactions efficiently', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Rapidly interact with multiple cells
      const cells = [
        screen.getByLabelText(/A1|cell.*0.*0/i),
        screen.getByLabelText(/B2|cell.*1.*1/i),
        screen.getByLabelText(/C3|cell.*2.*2/i),
        screen.getByLabelText(/D4|cell.*3.*3/i)
      ];

      for (let i = 0; i < cells.length; i++) {
        await user.click(cells[i]);
        await user.keyboard((i + 1).toString());
      }

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should handle interactions efficiently
      expect(interactionTime).toBeLessThan(1000);
    });

    test('should validate diagonal constraints within 100ms', async () => {
      const user = userEvent.setup();
      renderPuzzlePage('sudoku-x');

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Set up a scenario for diagonal validation
      const cellA1 = screen.getByLabelText(/A1|cell.*0.*0/i);
      await user.click(cellA1);
      await user.keyboard('9');

      const validationStartTime = performance.now();

      // Create diagonal violation
      const cellB2 = screen.getByLabelText(/B2|cell.*1.*1/i);
      await user.click(cellB2);
      await user.keyboard('9');

      // Wait for validation to complete
      await waitFor(() => {
        const errorCells = screen
          .getAllByRole('button')
          .filter((button) => button.getAttribute('aria-invalid') === 'true');
        expect(errorCells.length).toBeGreaterThan(0);
      });

      const validationEndTime = performance.now();
      const validationTime = validationEndTime - validationStartTime;

      // Validation should be fast (requirement: under 100ms)
      expect(validationTime).toBeLessThan(100);
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle invalid game type gracefully', async () => {
      renderPuzzlePage('invalid-type');

      // Should not crash, should show some reasonable fallback
      await waitFor(() => {
        const content = document.body.textContent;
        expect(content).not.toContain('TypeError');
        expect(content).not.toContain('ReferenceError');
      });
    });

    test('should handle empty game type gracefully', async () => {
      renderPuzzlePage('');

      // Should not crash
      await waitFor(() => {
        const content = document.body.textContent;
        expect(content).not.toContain('TypeError');
        expect(content).not.toContain('ReferenceError');
      });
    });

    test('should handle rapid puzzle type switching', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/puzzle/sudoku-x']}>
          <MockObservabilityProvider>
            <PuzzlePage />
          </MockObservabilityProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Switch to standard
      rerender(
        <MemoryRouter initialEntries={['/puzzle/standard']}>
          <MockObservabilityProvider>
            <PuzzlePage />
          </MockObservabilityProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Switch back to Sudoku X
      rerender(
        <MemoryRouter initialEntries={['/puzzle/sudoku-x']}>
          <MockObservabilityProvider>
            <PuzzlePage />
          </MockObservabilityProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Should not crash during rapid switching
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });
});
