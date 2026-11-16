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
const SudokuGridEntry_1 = require('../../../components/SudokuGridEntry');
const SudokuGridEntry_testHelpers_1 = require('./SudokuGridEntry.testHelpers');
describe('SudokuGridEntry - Phase 2: Advanced Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = SudokuGridEntry_testHelpers_1.mockMatchMedia;
    // Default to desktop dimensions (tests that need mobile will override)
    (0, SudokuGridEntry_testHelpers_1.setWindowDimensions)(1024, 768);
  });
  describe('Phase 2.1: Drag-to-Add Multiselect', () => {
    test('should start drag mode on long press', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cell = react_2.screen.getByTestId('sudoku-cell-A2');
      // Simulate long press with mouse down and hold
      react_2.fireEvent.mouseDown(cell);
      // Wait for long press timeout (500ms based on useLongPress default)
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      // Long press should have selected the cell
      expect(cell).toHaveAttribute('aria-selected', 'true');
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
    test('should add cells to selection during drag', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      const cellA4 = react_2.screen.getByTestId('sudoku-cell-A4');
      // Start long press on cellA2
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      // cellA2 should be selected
      expect(cellA2).toHaveAttribute('aria-selected', 'true');
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // Drag over cellA3 and cellA4 (mouse move)
      react_2.fireEvent.mouseMove(cellA3);
      // cellA3 should now be added to selection
      await (0, react_2.waitFor)(() => {
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      react_2.fireEvent.mouseMove(cellA4);
      // cellA4 should now be added to selection
      await (0, react_2.waitFor)(() => {
        expect(cellA4).toHaveAttribute('aria-selected', 'true');
      });
      // All three should be selected
      expect(react_2.screen.getAllByText(/3 cells selected/).length).toBeGreaterThan(0);
    });
    test('should stop adding cells after drag ends', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      const cellA4 = react_2.screen.getByTestId('sudoku-cell-A4');
      // Start drag
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // Drag over cellA3
      react_2.fireEvent.mouseMove(cellA3);
      await (0, react_2.waitFor)(() => {
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      // End drag
      react_2.fireEvent.mouseUp(cellA3);
      // Try to drag over cellA4 - should not be added since drag ended
      react_2.fireEvent.mouseMove(cellA4);
      // Wait a bit to ensure no change
      await (0, react_2.act)(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      // cellA4 should NOT be selected
      expect(cellA4).toHaveAttribute('aria-selected', 'false');
      // Only 2 cells should be selected
      expect(react_2.screen.getAllByText(/2 cells selected/).length).toBeGreaterThan(0);
    });
    test('should not remove cells during drag operation', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      // Start drag on cellA2
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      expect(cellA2).toHaveAttribute('aria-selected', 'true');
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // Drag over cellA3
      react_2.fireEvent.mouseMove(cellA3);
      await (0, react_2.waitFor)(() => {
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      // Drag back over cellA2 (already selected)
      react_2.fireEvent.mouseMove(cellA2);
      // Wait a bit
      await (0, react_2.act)(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      // cellA2 should still be selected (not removed)
      expect(cellA2).toHaveAttribute('aria-selected', 'true');
      expect(cellA3).toHaveAttribute('aria-selected', 'true');
    });
    test('should support touch-based drag-to-add', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      // Start touch long press
      react_2.fireEvent.touchStart(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      expect(cellA2).toHaveAttribute('aria-selected', 'true');
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // Touch move over cellA3
      react_2.fireEvent.touchMove(cellA3);
      await (0, react_2.waitFor)(() => {
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      // End touch
      react_2.fireEvent.touchEnd(cellA3);
      // Both cells should be selected
      expect(react_2.screen.getAllByText(/2 cells selected/).length).toBeGreaterThan(0);
    });
    test('should remove cell from selection via long press toggle', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      // First, select multiple cells using Ctrl+click
      react_2.fireEvent.click(cellA2);
      react_2.fireEvent.click(cellA3, { ctrlKey: true });
      // Both cells should be selected
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-selected', 'true');
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      // Now long press on cellA2 to remove it from selection
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // cellA2 should be removed from selection, cellA3 should remain selected
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-selected', 'false');
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      // Only one cell should be selected now
      expect(react_2.screen.queryByText(/2 cells selected/)).not.toBeInTheDocument();
    });
    test('should update primary selection when removing primary cell via long press', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      const cellA4 = react_2.screen.getByTestId('sudoku-cell-A4');
      // Select multiple cells (A2 becomes primary as it's first selected)
      react_2.fireEvent.click(cellA2);
      react_2.fireEvent.click(cellA3, { ctrlKey: true });
      react_2.fireEvent.click(cellA4, { ctrlKey: true });
      // All three should be selected
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getAllByText(/3 cells selected/).length).toBeGreaterThan(0);
      });
      // Long press on cellA2 (the primary) to remove it
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // cellA2 should be removed, and cellA3 should become the new primary
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-selected', 'false');
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
        expect(cellA4).toHaveAttribute('aria-selected', 'true');
      });
      // Two cells should be selected now
      expect(react_2.screen.getAllByText(/2 cells selected/).length).toBeGreaterThan(0);
    });
    test('should clear selection when removing the only selected cell via long press', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      // Select a single cell
      react_2.fireEvent.click(cellA2);
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-selected', 'true');
      });
      // Long press on the only selected cell to deselect it
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // Cell should be deselected (selection cleared)
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-selected', 'false');
      });
      // No cells should be selected
      expect(react_2.screen.queryByText(/cells selected/)).not.toBeInTheDocument();
    });
    test('should update primary cell when removing primary via long press from drag-added selection', async () => {
      jest.useFakeTimers();
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      const cellA4 = react_2.screen.getByTestId('sudoku-cell-A4');
      // Start drag on cellA2 - this makes A2 the primary
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      expect(cellA2).toHaveAttribute('aria-selected', 'true');
      // End the initial long press timer
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // Drag over cellA3 and cellA4 to add them (does NOT change primary)
      react_2.fireEvent.mouseMove(cellA3);
      await (0, react_2.waitFor)(() => {
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
      });
      react_2.fireEvent.mouseMove(cellA4);
      await (0, react_2.waitFor)(() => {
        expect(cellA4).toHaveAttribute('aria-selected', 'true');
      });
      // End drag
      react_2.fireEvent.mouseUp(cellA4);
      // All three should be selected, A2 is still the primary
      expect(react_2.screen.getAllByText(/3 cells selected/).length).toBeGreaterThan(0);
      // Now use fake timers again for the second long press
      jest.useFakeTimers();
      // Long press on cellA2 (the primary) to remove it
      react_2.fireEvent.mouseDown(cellA2);
      (0, SudokuGridEntry_testHelpers_1.advanceByLongPress)();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      // cellA2 should be removed, and cellA3 should become the new primary
      // This tests line 232: setSelectedCell(newSelection[0])
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-selected', 'false');
        expect(cellA3).toHaveAttribute('aria-selected', 'true');
        expect(cellA4).toHaveAttribute('aria-selected', 'true');
      });
      // Two cells should be selected now
      expect(react_2.screen.getAllByText(/2 cells selected/).length).toBeGreaterThan(0);
    });
  });
  describe('Phase 2.2: Navigation', () => {
    test('should navigate right with arrow key', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cell A1
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      react_2.fireEvent.click(cellA1);
      expect(cellA1).toHaveAttribute('aria-selected', 'true');
      // Navigate right
      const grid = react_2.screen.getByTestId('sudoku-grid');
      react_2.fireEvent.keyDown(grid, { key: 'ArrowRight', code: 'ArrowRight' });
      // Cell A2 should now be selected
      await (0, react_2.waitFor)(() => {
        const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
        expect(cellA2).toHaveAttribute('aria-selected', 'true');
      });
    });
    test('should navigate left with arrow key', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cell A3 (column 2)
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      react_2.fireEvent.click(cellA3);
      // Navigate left
      const grid = react_2.screen.getByTestId('sudoku-grid');
      react_2.fireEvent.keyDown(grid, { key: 'ArrowLeft', code: 'ArrowLeft' });
      // Cell A2 should now be selected
      await (0, react_2.waitFor)(() => {
        const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
        expect(cellA2).toHaveAttribute('aria-selected', 'true');
      });
    });
    test('should navigate down with arrow key', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cell A1 (row 0)
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      react_2.fireEvent.click(cellA1);
      // Navigate down
      const grid = react_2.screen.getByTestId('sudoku-grid');
      react_2.fireEvent.keyDown(grid, { key: 'ArrowDown', code: 'ArrowDown' });
      // Cell B1 (row 1, same column) should now be selected
      await (0, react_2.waitFor)(() => {
        const cellB1 = react_2.screen.getByTestId('sudoku-cell-B1');
        expect(cellB1).toHaveAttribute('aria-selected', 'true');
      });
    });
    test('should navigate up with arrow key', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cell B1 (row 1)
      const cellB1 = react_2.screen.getByTestId('sudoku-cell-B1');
      react_2.fireEvent.click(cellB1);
      // Navigate up
      const grid = react_2.screen.getByTestId('sudoku-grid');
      react_2.fireEvent.keyDown(grid, { key: 'ArrowUp', code: 'ArrowUp' });
      // Cell A1 (row 0) should now be selected
      await (0, react_2.waitFor)(() => {
        const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
        expect(cellA1).toHaveAttribute('aria-selected', 'true');
      });
    });
    test('should handle navigation at grid boundaries', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select top-left cell (A1)
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      react_2.fireEvent.click(cellA1);
      const grid = react_2.screen.getByTestId('sudoku-grid');
      // Try to navigate up from top edge - should stay at A1
      react_2.fireEvent.keyDown(grid, { key: 'ArrowUp', code: 'ArrowUp' });
      await (0, react_2.act)(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      expect(cellA1).toHaveAttribute('aria-selected', 'true');
      // Try to navigate left from left edge - should stay at A1
      react_2.fireEvent.keyDown(grid, { key: 'ArrowLeft', code: 'ArrowLeft' });
      await (0, react_2.act)(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      expect(cellA1).toHaveAttribute('aria-selected', 'true');
    });
  });
  // ============================================================
  // Phase 2.3: Killer Sudoku Features
  // ============================================================
  describe('Phase 2.3: Killer Sudoku Features', () => {
    test('should show combinations button when killer sudoku puzzle is loaded', async () => {
      const killerPuzzleDescription = (0, SudokuGridEntry_testHelpers_1.createPuzzleDefinition)({
        id: 'killer-puzzle',
        description: 'Killer Sudoku Test',
        type: 'killer-sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells:
          'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
      });
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: killerPuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Combinations button should be present
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      expect(combinationsButton).toBeInTheDocument();
      expect(combinationsButton).toBeDisabled(); // Disabled until cells from a single cage are selected
    });
    test('should enable combinations button when cells from a single cage are selected', async () => {
      const killerPuzzleDescription = (0, SudokuGridEntry_testHelpers_1.createPuzzleDefinition)({
        id: 'killer-puzzle',
        description: 'Killer Sudoku Test',
        type: 'killer-sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells:
          'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
      });
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: killerPuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cells from the same cage (cage 'A' contains cells A1 and A2)
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      const cellB1 = react_2.screen.getByTestId('sudoku-cell-B1');
      react_2.fireEvent.click(cellA1);
      react_2.fireEvent.click(cellB1, { ctrlKey: true });
      // Combinations button should now be enabled
      await (0, react_2.waitFor)(() => {
        const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
        expect(combinationsButton).not.toBeDisabled();
      });
    });
    test('should disable combinations button when cells from multiple cages are selected', async () => {
      const killerPuzzleDescription = (0, SudokuGridEntry_testHelpers_1.createPuzzleDefinition)({
        id: 'killer-puzzle',
        description: 'Killer Sudoku Test',
        type: 'killer-sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells:
          'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
      });
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: killerPuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cells from different cages (cage 'A' = A1/B1, cage 'B' = A2)
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      react_2.fireEvent.click(cellA1);
      react_2.fireEvent.click(cellA2, { ctrlKey: true });
      // Combinations button should be disabled since cells are from different cages
      await (0, react_2.waitFor)(() => {
        const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
        expect(combinationsButton).toBeDisabled();
      });
    });
    test('should open combinations explorer when combinations button is clicked', async () => {
      const killerPuzzleDescription = (0, SudokuGridEntry_testHelpers_1.createPuzzleDefinition)({
        id: 'killer-puzzle',
        description: 'Killer Sudoku Test',
        type: 'killer-sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells:
          'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
      });
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: killerPuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cells from the same cage
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      react_2.fireEvent.click(cellA1);
      // Click combinations button
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      await (0, react_2.waitFor)(() => {
        expect(combinationsButton).not.toBeDisabled();
      });
      react_2.fireEvent.click(combinationsButton);
      // Explorer should be open (check for modal/panel content)
      await (0, react_2.waitFor)(() => {
        // The modal should render - look for heading (more specific than just "combinations")
        const elements = react_2.screen.getAllByText(/combinations/i);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
    test('should open combinations explorer with Ctrl+K keyboard shortcut', async () => {
      const killerPuzzleDescription = (0, SudokuGridEntry_testHelpers_1.createPuzzleDefinition)({
        id: 'killer-puzzle',
        description: 'Killer Sudoku Test',
        type: 'killer-sudoku',
        level: 1,
        totalRows: 9,
        totalColumns: 9,
        cells:
          'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11'
      });
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: killerPuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Select cells from the same cage
      const cellA1 = react_2.screen.getByTestId('sudoku-cell-A1');
      react_2.fireEvent.click(cellA1);
      // Use keyboard shortcut
      react_2.fireEvent.keyDown(document, { key: 'k', code: 'KeyK', ctrlKey: true });
      // Explorer should be open
      await (0, react_2.waitFor)(() => {
        const elements = react_2.screen.getAllByText(/combinations/i);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });
  // ============================================================
  // Phase 2.4: Input Mode Switching
  // ============================================================
  describe('Phase 2.4: Input Mode Switching', () => {
    test('should persist notes mode when switching between cells', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Notes mode is default - add note to first cell
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      react_2.fireEvent.click(cellA2);
      react_2.fireEvent.keyDown(cellA2, { key: '3', code: 'Digit3' });
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 3/));
      });
      // Switch to another cell - should still be in notes mode
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      react_2.fireEvent.click(cellA3);
      react_2.fireEvent.keyDown(cellA3, { key: '5', code: 'Digit5' });
      await (0, react_2.waitFor)(() => {
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 5/));
      });
    });
    test('should return to notes mode after Shift modifier override', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Use Shift to enter value (temporary override)
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      react_2.fireEvent.click(cellA2);
      react_2.fireEvent.keyDown(cellA2, { key: '7', code: 'Digit7', shiftKey: true });
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveTextContent('7');
      });
      // After Shift modifier, should return to notes mode (default)
      const cellA3 = react_2.screen.getByTestId('sudoku-cell-A3');
      react_2.fireEvent.click(cellA3);
      react_2.fireEvent.keyDown(cellA3, { key: '4', code: 'Digit4' });
      await (0, react_2.waitFor)(() => {
        // Should add as note, not value
        expect(cellA3).toHaveAttribute('aria-label', expect.stringMatching(/notes: 4/));
      });
    });
    test('should maintain notes mode after undo operation', async () => {
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Add note in notes mode
      const cellA2 = react_2.screen.getByTestId('sudoku-cell-A2');
      react_2.fireEvent.click(cellA2);
      react_2.fireEvent.keyDown(cellA2, { key: '6', code: 'Digit6' });
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 6/));
      });
      // Undo the note
      const undoButton = react_2.screen.getByTestId('compact-undo-button');
      react_2.fireEvent.click(undoButton);
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/empty/));
      });
      // Should still be in notes mode - add another note
      react_2.fireEvent.keyDown(cellA2, { key: '8', code: 'Digit8' });
      await (0, react_2.waitFor)(() => {
        expect(cellA2).toHaveAttribute('aria-label', expect.stringMatching(/notes: 8/));
      });
    });
  });
  // ============================================================
  // Phase 2.5: Responsive Layout Modes
  // ============================================================
  describe('Phase 2.5: Responsive Layout Modes', () => {
    test('should show keypads in mobile portrait view (side-by-side)', async () => {
      // Mobile portrait layout ensures keypads are visible (side-by-side)
      (0, SudokuGridEntry_testHelpers_1.renderWithMobilePortrait)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // Both keypads should be visible in mobile view
      expect(react_2.screen.getByTestId('keypad-notes-1')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('keypad-values-1')).toBeInTheDocument();
    });
    test('should show keypads in stacked layout mode', async () => {
      // Force stacked layout mode to test the stacked keypad code path
      (0, SudokuGridEntry_testHelpers_1.customRender)(
        react_1.default.createElement(SudokuGridEntry_1.SudokuGridEntry, {
          ...SudokuGridEntry_testHelpers_1.defaultProps,
          initialPuzzleDescription: SudokuGridEntry_testHelpers_1.simplePuzzleDescription,
          forceLayoutMode: 'stacked'
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
      // The DualKeypad component should be rendered in stacked mode
      expect(react_2.screen.getByTestId('dual-keypad')).toBeInTheDocument();
      // Both keypads should be visible in stacked layout
      expect(react_2.screen.getByTestId('keypad-notes-1')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('keypad-values-1')).toBeInTheDocument();
    });
  });
});
//# sourceMappingURL=SudokuGridEntry.phase2.test.js.map
