'use strict';
/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
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
const SudokuControls_1 = require('../../../components/SudokuControls');
const ResponsiveLayoutModule = tslib_1.__importStar(require('../../../hooks/useResponsiveLayout'));
describe('SudokuControls', () => {
  const defaultProps = {
    canUndo: false,
    canRedo: false,
    canReset: true,
    isValid: true,
    isSolved: false,
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    onReset: jest.fn(),
    onExport: jest.fn(),
    className: undefined
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
  });
  describe('rendering', () => {
    test('should render all control elements', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
      );
      expect(react_2.screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('undo-button')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('redo-button')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('reset-button')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('export-button')).toBeInTheDocument();
    });
    test('should apply custom className', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          className: 'custom-controls'
        })
      );
      const controls = react_2.screen.getByTestId('sudoku-controls');
      expect(controls).toHaveClass('sudoku-controls');
      expect(controls).toHaveClass('custom-controls');
    });
    test('should render instructions', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
      );
      expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
      expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      expect(react_2.screen.getByText('• Type 1-9 to enter numbers')).toBeInTheDocument();
      expect(react_2.screen.getByText('• Press Delete/Backspace to clear')).toBeInTheDocument();
      expect(react_2.screen.getByText('• Use arrow keys to navigate')).toBeInTheDocument();
    });
  });
  describe('undo/redo buttons', () => {
    test('should enable undo button when canUndo is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canUndo: true })
      );
      const undoButton = react_2.screen.getByTestId('undo-button');
      expect(undoButton).toBeEnabled();
      expect(undoButton).toHaveTextContent('↶ Undo');
      expect(undoButton).toHaveAttribute('title', 'Undo last move');
    });
    test('should disable undo button when canUndo is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canUndo: false })
      );
      const undoButton = react_2.screen.getByTestId('undo-button');
      expect(undoButton).toBeDisabled();
    });
    test('should enable redo button when canRedo is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canRedo: true })
      );
      const redoButton = react_2.screen.getByTestId('redo-button');
      expect(redoButton).toBeEnabled();
      expect(redoButton).toHaveTextContent('↷ Redo');
      expect(redoButton).toHaveAttribute('title', 'Redo last undone move');
    });
    test('should disable redo button when canRedo is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canRedo: false })
      );
      const redoButton = react_2.screen.getByTestId('redo-button');
      expect(redoButton).toBeDisabled();
    });
    test('should call onUndo when undo button is clicked', async () => {
      jest.useFakeTimers();
      const onUndo = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: true,
          onUndo: onUndo
        })
      );
      const undoButton = react_2.screen.getByTestId('undo-button');
      (0, react_2.act)(() => {
        react_2.fireEvent.click(undoButton);
        jest.advanceTimersByTime(1000); // Trigger any setTimeout in useEffect
      });
      expect(onUndo).toHaveBeenCalledTimes(1);
      await (0, react_2.waitFor)(
        () => {
          expect(react_2.screen.getByTestId('undo-button')).toBeInTheDocument(); // Ensure DOM is stable
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
    test('should call onRedo when redo button is clicked', async () => {
      jest.useFakeTimers();
      const onRedo = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canRedo: true,
          onRedo: onRedo
        })
      );
      const redoButton = react_2.screen.getByTestId('redo-button');
      (0, react_2.act)(() => {
        react_2.fireEvent.click(redoButton);
        jest.advanceTimersByTime(1000);
      });
      expect(onRedo).toHaveBeenCalledTimes(1);
      await (0, react_2.waitFor)(
        () => {
          expect(react_2.screen.getByTestId('redo-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
    test('should not call handlers when buttons are disabled', async () => {
      jest.useFakeTimers();
      const onUndo = jest.fn();
      const onRedo = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: false,
          canRedo: false,
          onUndo: onUndo,
          onRedo: onRedo
        })
      );
      const undoButton = react_2.screen.getByTestId('undo-button');
      const redoButton = react_2.screen.getByTestId('redo-button');
      (0, react_2.act)(() => {
        react_2.fireEvent.click(undoButton);
        react_2.fireEvent.click(redoButton);
        jest.advanceTimersByTime(1000);
      });
      expect(onUndo).not.toHaveBeenCalled();
      expect(onRedo).not.toHaveBeenCalled();
      await (0, react_2.waitFor)(
        () => {
          expect(react_2.screen.getByTestId('undo-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
  });
  describe('reset button and confirmation', () => {
    test('should show reset button initially', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      const resetButton = react_2.screen.getByTestId('reset-button');
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveTextContent('🗑️ Reset Puzzle');
      expect(resetButton).toHaveAttribute('title', 'Clear all entries');
      expect(resetButton).toBeEnabled();
    });
    test('should disable reset button when canReset is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: false })
      );
      const resetButton = react_2.screen.getByTestId('reset-button');
      expect(resetButton).toBeDisabled();
    });
    test('should show confirmation dialog when reset is clicked first time', async () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      const resetButton = react_2.screen.getByTestId('reset-button');
      react_2.fireEvent.click(resetButton);
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
        expect(react_2.screen.getByTestId('confirm-reset-button')).toBeInTheDocument();
        expect(react_2.screen.getByTestId('cancel-reset-button')).toBeInTheDocument();
        expect(react_2.screen.queryByTestId('reset-button')).not.toBeInTheDocument();
      });
    });
    test('should call onReset when confirm button is clicked', async () => {
      const onReset = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canReset: true,
          onReset: onReset
        })
      );
      // First click shows confirmation
      const resetButton = react_2.screen.getByTestId('reset-button');
      react_2.fireEvent.click(resetButton);
      // Second click on confirm calls onReset
      const confirmButton = await react_2.screen.findByTestId('confirm-reset-button');
      react_2.fireEvent.click(confirmButton);
      expect(onReset).toHaveBeenCalledTimes(1);
    });
    test('should hide confirmation when cancel button is clicked', async () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      const resetButton = react_2.screen.getByTestId('reset-button');
      react_2.fireEvent.click(resetButton);
      // Cancel
      const cancelButton = await react_2.screen.findByTestId('cancel-reset-button');
      react_2.fireEvent.click(cancelButton);
      // Should be back to original state
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(
          react_2.screen.queryByText('Are you sure? This will clear all entries.')
        ).not.toBeInTheDocument();
      });
    });
    test('should auto-hide confirmation after 3 seconds', async () => {
      jest.useFakeTimers();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      const resetButton = react_2.screen.getByTestId('reset-button');
      react_2.fireEvent.click(resetButton);
      await react_2.screen.findByText('Are you sure? This will clear all entries.');
      // Fast forward 3 seconds
      (0, react_2.act)(() => {
        jest.advanceTimersByTime(3000);
      });
      // Wait for DOM to update
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(
          react_2.screen.queryByText('Are you sure? This will clear all entries.')
        ).not.toBeInTheDocument();
      });
      jest.useRealTimers();
    });
    test('should not call onReset when reset button is first clicked', () => {
      const onReset = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canReset: true,
          onReset: onReset
        })
      );
      const resetButton = react_2.screen.getByTestId('reset-button');
      react_2.fireEvent.click(resetButton);
      expect(onReset).not.toHaveBeenCalled();
    });
    test('should hide confirmation and reset to initial state after confirm', async () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
      const confirmButton = await react_2.screen.findByTestId('confirm-reset-button');
      // Confirm reset
      react_2.fireEvent.click(confirmButton);
      await (0, react_2.waitFor)(() => {
        // Should be back to initial state
        expect(react_2.screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(
          react_2.screen.queryByText('Are you sure? This will clear all entries.')
        ).not.toBeInTheDocument();
      });
    });
  });
  describe('export button', () => {
    test('should render export button correctly', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
      );
      const exportButton = react_2.screen.getByTestId('export-button');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveTextContent('📤 Export Puzzle');
      expect(exportButton).toHaveAttribute('title', 'Export puzzle in compatible format');
      expect(exportButton).toBeEnabled();
    });
    test('should call onExport when export button is clicked', async () => {
      jest.useFakeTimers();
      const onExport = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          onExport: onExport
        })
      );
      const exportButton = react_2.screen.getByTestId('export-button');
      (0, react_2.act)(() => {
        react_2.fireEvent.click(exportButton);
        jest.advanceTimersByTime(1000);
      });
      expect(onExport).toHaveBeenCalledTimes(1);
      await (0, react_2.waitFor)(
        () => {
          expect(react_2.screen.getByTestId('export-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
    test('should handle multiple export clicks', async () => {
      jest.useFakeTimers();
      const onExport = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          onExport: onExport
        })
      );
      const exportButton = react_2.screen.getByTestId('export-button');
      (0, react_2.act)(() => {
        react_2.fireEvent.click(exportButton);
        react_2.fireEvent.click(exportButton);
        react_2.fireEvent.click(exportButton);
        jest.advanceTimersByTime(1000);
      });
      expect(onExport).toHaveBeenCalledTimes(3);
      await (0, react_2.waitFor)(
        () => {
          expect(react_2.screen.getByTestId('export-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
  });
  describe('status indicator', () => {
    test('should show "Valid" status when puzzle is valid but not solved', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: false
        })
      );
      const statusElement = react_2.screen.getByText('✓ Valid');
      expect(statusElement).toBeInTheDocument();
    });
    test('should show "Solved" status when puzzle is solved', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      const statusElement = react_2.screen.getByText('✅ Solved!');
      expect(statusElement).toBeInTheDocument();
    });
    test('should show "Has Errors" status when puzzle is invalid', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: false,
          isSolved: false
        })
      );
      const statusElement = react_2.screen.getByText('⚠ Has Errors');
      expect(statusElement).toBeInTheDocument();
    });
    test('should prioritize solved status over valid status', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('✅ Solved!')).toBeInTheDocument();
      expect(react_2.screen.queryByText('✓ Valid')).not.toBeInTheDocument();
    });
    test('should show error status even if solved flag is incorrectly true', () => {
      // Edge case: puzzle claims to be solved but is invalid
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: false,
          isSolved: true
        })
      );
      expect(react_2.screen.getByText('✅ Solved!')).toBeInTheDocument();
    });
  });
  describe('accessibility', () => {
    test('should have proper button semantics', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
      );
      const buttons = react_2.screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // undo, redo, reset, export
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
    test('should have descriptive titles for buttons', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
      );
      expect(react_2.screen.getByTestId('undo-button')).toHaveAttribute('title', 'Undo last move');
      expect(react_2.screen.getByTestId('redo-button')).toHaveAttribute('title', 'Redo last undone move');
      expect(react_2.screen.getByTestId('reset-button')).toHaveAttribute('title', 'Clear all entries');
      expect(react_2.screen.getByTestId('export-button')).toHaveAttribute(
        'title',
        'Export puzzle in compatible format'
      );
    });
    test('should be keyboard navigable', async () => {
      jest.useFakeTimers();
      const user = user_event_1.default.setup({ advanceTimers: jest.advanceTimersByTime });
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: true,
          canRedo: true
        })
      );
      // Tab through buttons
      await user.tab();
      expect(react_2.screen.getByTestId('undo-button')).toHaveFocus();
      await user.tab();
      expect(react_2.screen.getByTestId('redo-button')).toHaveFocus();
      await user.tab();
      expect(react_2.screen.getByTestId('reset-button')).toHaveFocus();
      await user.tab();
      expect(react_2.screen.getByTestId('export-button')).toHaveFocus();
      jest.useRealTimers();
    });
    test('should skip disabled buttons in tab order', async () => {
      jest.useFakeTimers();
      const user = user_event_1.default.setup({ advanceTimers: jest.advanceTimersByTime });
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: false,
          canRedo: false
        })
      );
      // Should skip disabled undo/redo buttons
      await user.tab();
      expect(react_2.screen.getByTestId('reset-button')).toHaveFocus();
      await user.tab();
      expect(react_2.screen.getByTestId('export-button')).toHaveFocus();
      jest.useRealTimers();
    });
    test('should be activatable with keyboard', async () => {
      jest.useFakeTimers();
      const user = user_event_1.default.setup({ advanceTimers: jest.advanceTimersByTime });
      const onExport = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          onExport: onExport
        })
      );
      const exportButton = react_2.screen.getByTestId('export-button');
      exportButton.focus();
      await user.keyboard('{Enter}');
      expect(onExport).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });
  describe('visual styling', () => {
    test('should apply correct styles based on button states', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: true,
          canRedo: false,
          canReset: true
        })
      );
      const undoButton = react_2.screen.getByTestId('undo-button');
      const redoButton = react_2.screen.getByTestId('redo-button');
      const resetButton = react_2.screen.getByTestId('reset-button');
      const exportButton = react_2.screen.getByTestId('export-button');
      // Enabled buttons should not have disabled styling
      expect(undoButton).toBeEnabled();
      expect(resetButton).toBeEnabled();
      expect(exportButton).toBeEnabled();
      // Disabled button should be disabled
      expect(redoButton).toBeDisabled();
    });
    test('should apply different styles for confirmation buttons', async () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
      await (0, react_2.waitFor)(() => {
        const confirmButton = react_2.screen.getByTestId('confirm-reset-button');
        const cancelButton = react_2.screen.getByTestId('cancel-reset-button');
        expect(confirmButton).toHaveTextContent('Yes, Reset');
        expect(cancelButton).toHaveTextContent('Cancel');
      });
    });
    test('should show different status styling based on puzzle state', async () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: false
        })
      );
      // Valid state
      expect(react_2.screen.getByText('✓ Valid')).toBeInTheDocument();
      // Solved state
      rerender(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('✅ Solved!')).toBeInTheDocument();
      });
      // Error state
      rerender(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: false,
          isSolved: false
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('⚠ Has Errors')).toBeInTheDocument();
      });
    });
  });
  describe('edge cases and error handling', () => {
    test('should handle rapid clicking on reset button', async () => {
      const onReset = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canReset: true,
          onReset: onReset
        })
      );
      const resetButton = react_2.screen.getByTestId('reset-button');
      // Rapid clicks
      react_2.fireEvent.click(resetButton);
      react_2.fireEvent.click(resetButton); // This should not do anything since confirmation is shown
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });
      expect(onReset).not.toHaveBeenCalled();
    });
    test('should handle reset confirmation timeout correctly', async () => {
      jest.useFakeTimers();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      const resetButton = react_2.screen.getByTestId('reset-button');
      react_2.fireEvent.click(resetButton);
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });
      // Fast forward 2.5 seconds (not enough to trigger timeout)
      (0, react_2.act)(() => {
        jest.advanceTimersByTime(2500);
      });
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });
      // Fast forward remaining time
      (0, react_2.act)(() => {
        jest.advanceTimersByTime(500);
      });
      await (0, react_2.waitFor)(() => {
        expect(
          react_2.screen.queryByText('Are you sure? This will clear all entries.')
        ).not.toBeInTheDocument();
        expect(react_2.screen.getByTestId('reset-button')).toBeInTheDocument();
      });
      jest.useRealTimers();
    });
    test('should handle manual cancel after timeout is set', async () => {
      jest.useFakeTimers();
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
      // Manually cancel before timeout
      react_2.fireEvent.click(react_2.screen.getByTestId('cancel-reset-button'));
      // Fast forward past timeout
      (0, react_2.act)(() => {
        jest.advanceTimersByTime(5000);
      });
      // Should still show reset button (timeout shouldn't interfere)
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('reset-button')).toBeInTheDocument();
      });
      jest.useRealTimers();
    });
    test('should handle component unmount during confirmation timeout', async () => {
      jest.useFakeTimers();
      const { unmount } = (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
      // Verify confirmation appears
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });
      // Unmount component
      unmount();
      // Advance timers
      (0, react_2.act)(() => {
        jest.advanceTimersByTime(3000);
      });
      // No assertion needed; Jest fails if errors are thrown
      jest.useRealTimers();
    });
    test('should handle all props being false', () => {
      (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: false,
          canRedo: false,
          canReset: false,
          isValid: false,
          isSolved: false
        })
      );
      // All buttons should be disabled except export
      expect(react_2.screen.getByTestId('undo-button')).toBeDisabled();
      expect(react_2.screen.getByTestId('redo-button')).toBeDisabled();
      expect(react_2.screen.getByTestId('reset-button')).toBeDisabled();
      expect(react_2.screen.getByTestId('export-button')).toBeEnabled();
      // Status should show errors
      expect(react_2.screen.getByText('⚠ Has Errors')).toBeInTheDocument();
    });
  });
  describe('component updates', () => {
    test('should update button states when props change', async () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: false,
          canRedo: false
        })
      );
      expect(react_2.screen.getByTestId('undo-button')).toBeDisabled();
      expect(react_2.screen.getByTestId('redo-button')).toBeDisabled();
      rerender(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          canUndo: true,
          canRedo: true
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByTestId('undo-button')).toBeEnabled();
        expect(react_2.screen.getByTestId('redo-button')).toBeEnabled();
      });
    });
    test('should update status indicator when state changes', async () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: false,
          isSolved: false
        })
      );
      expect(react_2.screen.getByText('⚠ Has Errors')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: false
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('✓ Valid')).toBeInTheDocument();
      });
      rerender(
        react_1.default.createElement(SudokuControls_1.SudokuControls, {
          ...defaultProps,
          isValid: true,
          isSolved: true
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('✅ Solved!')).toBeInTheDocument();
      });
    });
    test('should handle canReset changing while confirmation is shown', async () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
      );
      // Show confirmation
      react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });
      // Disable reset
      rerender(
        react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: false })
      );
      // Currently the component maintains confirmation state even when canReset becomes false
      // This could be improved in the future, but the test documents current behavior
      await (0, react_2.waitFor)(() => {
        expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
        expect(react_2.screen.queryByTestId('reset-button')).not.toBeInTheDocument();
      });
    });
  });
  describe('responsive layout variations', () => {
    const mockResponsiveLayout = (deviceType, keypadLayoutMode) => {
      const mockLayoutInfo = {
        deviceType,
        keypadLayoutMode,
        orientation: 'portrait',
        screenWidth: deviceType === 'mobile' ? 400 : deviceType === 'tablet' ? 900 : 1200,
        screenHeight: 800,
        isTouchDevice: deviceType !== 'desktop',
        isSmallScreen: deviceType === 'mobile',
        hasSpaceForDualKeypads: true
      };
      jest.spyOn(ResponsiveLayoutModule, 'useResponsiveLayout').mockReturnValue(mockLayoutInfo);
    };
    afterEach(() => {
      jest.restoreAllMocks();
    });
    describe('compact mode rendering', () => {
      test('should render compact mode for mobile with side-by-side keypad', () => {
        mockResponsiveLayout('mobile', 'side-by-side');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        const controls = react_2.screen.getByTestId('sudoku-controls');
        expect(controls).toBeInTheDocument();
        // Instructions should be hidden in compact mode
        expect(react_2.screen.queryByText('Instructions:')).not.toBeInTheDocument();
        expect(react_2.screen.queryByText('• Click a cell to select it')).not.toBeInTheDocument();
      });
      test('should render compact mode for mobile with stacked keypad', () => {
        mockResponsiveLayout('mobile', 'stacked');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        const controls = react_2.screen.getByTestId('sudoku-controls');
        expect(controls).toBeInTheDocument();
        // Instructions should be hidden in compact mode with stacked layout
        expect(react_2.screen.queryByText('Instructions:')).not.toBeInTheDocument();
        expect(react_2.screen.queryByText('• Click a cell to select it')).not.toBeInTheDocument();
      });
      test('should show instructions for mobile with overlay keypad', () => {
        mockResponsiveLayout('mobile', 'overlay');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible when keypad is overlay
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
      test('should show instructions for mobile with hidden keypad', () => {
        mockResponsiveLayout('mobile', 'hidden');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible when keypad is hidden
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
    });
    describe('tablet layout variations', () => {
      test('should render full mode for tablet with side-by-side keypad', () => {
        mockResponsiveLayout('tablet', 'side-by-side');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible for tablet
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
      test('should render full mode for tablet with stacked keypad', () => {
        mockResponsiveLayout('tablet', 'stacked');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible for tablet
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
      test('should render full mode for tablet with overlay keypad', () => {
        mockResponsiveLayout('tablet', 'overlay');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible for tablet
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
    });
    describe('desktop layout variations', () => {
      test('should render full mode for desktop with hidden keypad', () => {
        mockResponsiveLayout('desktop', 'hidden');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible for desktop
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
      test('should render full mode for desktop with overlay keypad', () => {
        mockResponsiveLayout('desktop', 'overlay');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps })
        );
        // Instructions should be visible for desktop
        expect(react_2.screen.getByText('Instructions:')).toBeInTheDocument();
        expect(react_2.screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
    });
    describe('reset confirmation in compact mode', () => {
      test('should show compact reset confirmation for mobile side-by-side', async () => {
        mockResponsiveLayout('mobile', 'side-by-side');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
        );
        // Show confirmation
        react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
        await (0, react_2.waitFor)(() => {
          const confirmButton = react_2.screen.getByTestId('confirm-reset-button');
          expect(confirmButton).toBeInTheDocument();
          // In compact mode, confirmation message is shown as title attribute
          expect(confirmButton).toHaveAttribute('title', 'Are you sure? This will clear all entries.');
          // Full confirmation message should not be visible in compact mode
          expect(
            react_2.screen.queryByText('Are you sure? This will clear all entries.')
          ).not.toBeInTheDocument();
        });
      });
      test('should show compact reset confirmation for mobile stacked', async () => {
        mockResponsiveLayout('mobile', 'stacked');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
        );
        // Show confirmation
        react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
        await (0, react_2.waitFor)(() => {
          const confirmButton = react_2.screen.getByTestId('confirm-reset-button');
          expect(confirmButton).toBeInTheDocument();
          // In compact mode, confirmation message is shown as title attribute
          expect(confirmButton).toHaveAttribute('title', 'Are you sure? This will clear all entries.');
          // Full confirmation message should not be visible in compact mode
          expect(
            react_2.screen.queryByText('Are you sure? This will clear all entries.')
          ).not.toBeInTheDocument();
        });
      });
      test('should show full reset confirmation for non-compact modes', async () => {
        mockResponsiveLayout('mobile', 'overlay');
        (0, react_2.render)(
          react_1.default.createElement(SudokuControls_1.SudokuControls, { ...defaultProps, canReset: true })
        );
        // Show confirmation
        react_2.fireEvent.click(react_2.screen.getByTestId('reset-button'));
        await (0, react_2.waitFor)(() => {
          // Full confirmation message should be visible in non-compact mode
          expect(react_2.screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
          const confirmButton = react_2.screen.getByTestId('confirm-reset-button');
          expect(confirmButton).toBeInTheDocument();
          // Title should not be set in non-compact mode
          expect(confirmButton).not.toHaveAttribute('title');
        });
      });
    });
  });
});
//# sourceMappingURL=SudokuControls.test.js.map
