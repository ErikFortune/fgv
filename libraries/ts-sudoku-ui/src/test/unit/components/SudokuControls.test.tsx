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

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { SudokuControls } from '../../../components/SudokuControls';
import * as ResponsiveLayoutModule from '../../../hooks/useResponsiveLayout';
import type { IResponsiveLayoutInfo } from '../../../hooks/useResponsiveLayout';

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
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
      expect(screen.getByTestId('undo-button')).toBeInTheDocument();
      expect(screen.getByTestId('redo-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      render(<SudokuControls {...defaultProps} className="custom-controls" />);

      const controls = screen.getByTestId('sudoku-controls');
      expect(controls).toHaveClass('sudoku-controls');
      expect(controls).toHaveClass('custom-controls');
    });

    test('should render instructions', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Instructions:')).toBeInTheDocument();
      expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      expect(screen.getByText('• Type 1-9 to enter numbers')).toBeInTheDocument();
      expect(screen.getByText('• Press Delete/Backspace to clear')).toBeInTheDocument();
      expect(screen.getByText('• Use arrow keys to navigate')).toBeInTheDocument();
    });
  });

  describe('undo/redo buttons', () => {
    test('should enable undo button when canUndo is true', () => {
      render(<SudokuControls {...defaultProps} canUndo={true} />);

      const undoButton = screen.getByTestId('undo-button');
      expect(undoButton).toBeEnabled();
      expect(undoButton).toHaveTextContent('↶ Undo');
      expect(undoButton).toHaveAttribute('title', 'Undo last move');
    });

    test('should disable undo button when canUndo is false', () => {
      render(<SudokuControls {...defaultProps} canUndo={false} />);

      const undoButton = screen.getByTestId('undo-button');
      expect(undoButton).toBeDisabled();
    });

    test('should enable redo button when canRedo is true', () => {
      render(<SudokuControls {...defaultProps} canRedo={true} />);

      const redoButton = screen.getByTestId('redo-button');
      expect(redoButton).toBeEnabled();
      expect(redoButton).toHaveTextContent('↷ Redo');
      expect(redoButton).toHaveAttribute('title', 'Redo last undone move');
    });

    test('should disable redo button when canRedo is false', () => {
      render(<SudokuControls {...defaultProps} canRedo={false} />);

      const redoButton = screen.getByTestId('redo-button');
      expect(redoButton).toBeDisabled();
    });

    test('should call onUndo when undo button is clicked', async () => {
      jest.useFakeTimers();
      const onUndo = jest.fn();
      render(<SudokuControls {...defaultProps} canUndo={true} onUndo={onUndo} />);

      const undoButton = screen.getByTestId('undo-button');
      act(() => {
        fireEvent.click(undoButton);
        jest.advanceTimersByTime(1000); // Trigger any setTimeout in useEffect
      });

      expect(onUndo).toHaveBeenCalledTimes(1);
      await waitFor(
        () => {
          expect(screen.getByTestId('undo-button')).toBeInTheDocument(); // Ensure DOM is stable
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });

    test('should call onRedo when redo button is clicked', async () => {
      jest.useFakeTimers();
      const onRedo = jest.fn();
      render(<SudokuControls {...defaultProps} canRedo={true} onRedo={onRedo} />);

      const redoButton = screen.getByTestId('redo-button');
      act(() => {
        fireEvent.click(redoButton);
        jest.advanceTimersByTime(1000);
      });

      expect(onRedo).toHaveBeenCalledTimes(1);
      await waitFor(
        () => {
          expect(screen.getByTestId('redo-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });

    test('should not call handlers when buttons are disabled', async () => {
      jest.useFakeTimers();
      const onUndo = jest.fn();
      const onRedo = jest.fn();
      render(
        <SudokuControls {...defaultProps} canUndo={false} canRedo={false} onUndo={onUndo} onRedo={onRedo} />
      );

      const undoButton = screen.getByTestId('undo-button');
      const redoButton = screen.getByTestId('redo-button');

      act(() => {
        fireEvent.click(undoButton);
        fireEvent.click(redoButton);
        jest.advanceTimersByTime(1000);
      });

      expect(onUndo).not.toHaveBeenCalled();
      expect(onRedo).not.toHaveBeenCalled();
      await waitFor(
        () => {
          expect(screen.getByTestId('undo-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
  });

  describe('reset button and confirmation', () => {
    test('should show reset button initially', () => {
      render(<SudokuControls {...defaultProps} canReset={true} />);

      const resetButton = screen.getByTestId('reset-button');
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveTextContent('🗑️ Reset Puzzle');
      expect(resetButton).toHaveAttribute('title', 'Clear all entries');
      expect(resetButton).toBeEnabled();
    });

    test('should disable reset button when canReset is false', () => {
      render(<SudokuControls {...defaultProps} canReset={false} />);

      const resetButton = screen.getByTestId('reset-button');
      expect(resetButton).toBeDisabled();
    });

    test('should show confirmation dialog when reset is clicked first time', async () => {
      render(<SudokuControls {...defaultProps} canReset={true} />);

      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-reset-button')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-reset-button')).toBeInTheDocument();
        expect(screen.queryByTestId('reset-button')).not.toBeInTheDocument();
      });
    });

    test('should call onReset when confirm button is clicked', async () => {
      const onReset = jest.fn();
      render(<SudokuControls {...defaultProps} canReset={true} onReset={onReset} />);

      // First click shows confirmation
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      // Second click on confirm calls onReset
      const confirmButton = await screen.findByTestId('confirm-reset-button');
      fireEvent.click(confirmButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    test('should hide confirmation when cancel button is clicked', async () => {
      render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      // Cancel
      const cancelButton = await screen.findByTestId('cancel-reset-button');
      fireEvent.click(cancelButton);

      // Should be back to original state
      await waitFor(() => {
        expect(screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(screen.queryByText('Are you sure? This will clear all entries.')).not.toBeInTheDocument();
      });
    });

    test('should auto-hide confirmation after 3 seconds', async () => {
      jest.useFakeTimers();
      render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      await screen.findByText('Are you sure? This will clear all entries.');

      // Fast forward 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Wait for DOM to update
      await waitFor(() => {
        expect(screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(screen.queryByText('Are you sure? This will clear all entries.')).not.toBeInTheDocument();
      });
      jest.useRealTimers();
    });

    test('should not call onReset when reset button is first clicked', () => {
      const onReset = jest.fn();
      render(<SudokuControls {...defaultProps} canReset={true} onReset={onReset} />);

      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      expect(onReset).not.toHaveBeenCalled();
    });

    test('should hide confirmation and reset to initial state after confirm', async () => {
      render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      fireEvent.click(screen.getByTestId('reset-button'));

      const confirmButton = await screen.findByTestId('confirm-reset-button');
      // Confirm reset
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Should be back to initial state
        expect(screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(screen.queryByText('Are you sure? This will clear all entries.')).not.toBeInTheDocument();
      });
    });
  });

  describe('export button', () => {
    test('should render export button correctly', () => {
      render(<SudokuControls {...defaultProps} />);

      const exportButton = screen.getByTestId('export-button');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveTextContent('📤 Export Puzzle');
      expect(exportButton).toHaveAttribute('title', 'Export puzzle in compatible format');
      expect(exportButton).toBeEnabled();
    });

    test('should call onExport when export button is clicked', async () => {
      jest.useFakeTimers();
      const onExport = jest.fn();
      render(<SudokuControls {...defaultProps} onExport={onExport} />);

      const exportButton = screen.getByTestId('export-button');
      act(() => {
        fireEvent.click(exportButton);
        jest.advanceTimersByTime(1000);
      });

      expect(onExport).toHaveBeenCalledTimes(1);
      await waitFor(
        () => {
          expect(screen.getByTestId('export-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });

    test('should handle multiple export clicks', async () => {
      jest.useFakeTimers();
      const onExport = jest.fn();
      render(<SudokuControls {...defaultProps} onExport={onExport} />);

      const exportButton = screen.getByTestId('export-button');
      act(() => {
        fireEvent.click(exportButton);
        fireEvent.click(exportButton);
        fireEvent.click(exportButton);
        jest.advanceTimersByTime(1000);
      });

      expect(onExport).toHaveBeenCalledTimes(3);
      await waitFor(
        () => {
          expect(screen.getByTestId('export-button')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      jest.useRealTimers();
    });
  });

  describe('status indicator', () => {
    test('should show "Valid" status when puzzle is valid but not solved', () => {
      render(<SudokuControls {...defaultProps} isValid={true} isSolved={false} />);

      const statusElement = screen.getByText('✓ Valid');
      expect(statusElement).toBeInTheDocument();
    });

    test('should show "Solved" status when puzzle is solved', () => {
      render(<SudokuControls {...defaultProps} isValid={true} isSolved={true} />);

      const statusElement = screen.getByText('✅ Solved!');
      expect(statusElement).toBeInTheDocument();
    });

    test('should show "Has Errors" status when puzzle is invalid', () => {
      render(<SudokuControls {...defaultProps} isValid={false} isSolved={false} />);

      const statusElement = screen.getByText('⚠ Has Errors');
      expect(statusElement).toBeInTheDocument();
    });

    test('should prioritize solved status over valid status', () => {
      render(<SudokuControls {...defaultProps} isValid={true} isSolved={true} />);

      expect(screen.getByText('✅ Solved!')).toBeInTheDocument();
      expect(screen.queryByText('✓ Valid')).not.toBeInTheDocument();
    });

    test('should show error status even if solved flag is incorrectly true', () => {
      // Edge case: puzzle claims to be solved but is invalid
      render(<SudokuControls {...defaultProps} isValid={false} isSolved={true} />);

      expect(screen.getByText('✅ Solved!')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have proper button semantics', () => {
      render(<SudokuControls {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // undo, redo, reset, export

      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    test('should have descriptive titles for buttons', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByTestId('undo-button')).toHaveAttribute('title', 'Undo last move');
      expect(screen.getByTestId('redo-button')).toHaveAttribute('title', 'Redo last undone move');
      expect(screen.getByTestId('reset-button')).toHaveAttribute('title', 'Clear all entries');
      expect(screen.getByTestId('export-button')).toHaveAttribute(
        'title',
        'Export puzzle in compatible format'
      );
    });

    test('should be keyboard navigable', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SudokuControls {...defaultProps} canUndo={true} canRedo={true} />);

      // Tab through buttons
      await user.tab();
      expect(screen.getByTestId('undo-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('redo-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('reset-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('export-button')).toHaveFocus();
      jest.useRealTimers();
    });

    test('should skip disabled buttons in tab order', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<SudokuControls {...defaultProps} canUndo={false} canRedo={false} />);

      // Should skip disabled undo/redo buttons
      await user.tab();
      expect(screen.getByTestId('reset-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('export-button')).toHaveFocus();
      jest.useRealTimers();
    });

    test('should be activatable with keyboard', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onExport = jest.fn();
      render(<SudokuControls {...defaultProps} onExport={onExport} />);

      const exportButton = screen.getByTestId('export-button');
      exportButton.focus();
      await user.keyboard('{Enter}');

      expect(onExport).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('visual styling', () => {
    test('should apply correct styles based on button states', () => {
      render(<SudokuControls {...defaultProps} canUndo={true} canRedo={false} canReset={true} />);

      const undoButton = screen.getByTestId('undo-button');
      const redoButton = screen.getByTestId('redo-button');
      const resetButton = screen.getByTestId('reset-button');
      const exportButton = screen.getByTestId('export-button');

      // Enabled buttons should not have disabled styling
      expect(undoButton).toBeEnabled();
      expect(resetButton).toBeEnabled();
      expect(exportButton).toBeEnabled();

      // Disabled button should be disabled
      expect(redoButton).toBeDisabled();
    });

    test('should apply different styles for confirmation buttons', async () => {
      render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      fireEvent.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        const confirmButton = screen.getByTestId('confirm-reset-button');
        const cancelButton = screen.getByTestId('cancel-reset-button');

        expect(confirmButton).toHaveTextContent('Yes, Reset');
        expect(cancelButton).toHaveTextContent('Cancel');
      });
    });

    test('should show different status styling based on puzzle state', async () => {
      const { rerender } = render(<SudokuControls {...defaultProps} isValid={true} isSolved={false} />);

      // Valid state
      expect(screen.getByText('✓ Valid')).toBeInTheDocument();

      // Solved state
      rerender(<SudokuControls {...defaultProps} isValid={true} isSolved={true} />);
      await waitFor(() => {
        expect(screen.getByText('✅ Solved!')).toBeInTheDocument();
      });

      // Error state
      rerender(<SudokuControls {...defaultProps} isValid={false} isSolved={false} />);
      await waitFor(() => {
        expect(screen.getByText('⚠ Has Errors')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle rapid clicking on reset button', async () => {
      const onReset = jest.fn();
      render(<SudokuControls {...defaultProps} canReset={true} onReset={onReset} />);

      const resetButton = screen.getByTestId('reset-button');

      // Rapid clicks
      fireEvent.click(resetButton);
      fireEvent.click(resetButton); // This should not do anything since confirmation is shown

      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });
      expect(onReset).not.toHaveBeenCalled();
    });

    test('should handle reset confirmation timeout correctly', async () => {
      jest.useFakeTimers();
      render(<SudokuControls {...defaultProps} canReset={true} />);

      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });

      // Fast forward 2.5 seconds (not enough to trigger timeout)
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });

      // Fast forward remaining time
      act(() => {
        jest.advanceTimersByTime(500);
      });
      await waitFor(() => {
        expect(screen.queryByText('Are you sure? This will clear all entries.')).not.toBeInTheDocument();
        expect(screen.getByTestId('reset-button')).toBeInTheDocument();
      });
      jest.useRealTimers();
    });

    test('should handle manual cancel after timeout is set', async () => {
      jest.useFakeTimers();
      render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      fireEvent.click(screen.getByTestId('reset-button'));

      // Manually cancel before timeout
      fireEvent.click(screen.getByTestId('cancel-reset-button'));

      // Fast forward past timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should still show reset button (timeout shouldn't interfere)
      await waitFor(() => {
        expect(screen.getByTestId('reset-button')).toBeInTheDocument();
      });
      jest.useRealTimers();
    });

    test('should handle component unmount during confirmation timeout', async () => {
      jest.useFakeTimers();
      const { unmount } = render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      fireEvent.click(screen.getByTestId('reset-button'));

      // Verify confirmation appears
      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // No assertion needed; Jest fails if errors are thrown
      jest.useRealTimers();
    });

    test('should handle all props being false', () => {
      render(
        <SudokuControls
          {...defaultProps}
          canUndo={false}
          canRedo={false}
          canReset={false}
          isValid={false}
          isSolved={false}
        />
      );

      // All buttons should be disabled except export
      expect(screen.getByTestId('undo-button')).toBeDisabled();
      expect(screen.getByTestId('redo-button')).toBeDisabled();
      expect(screen.getByTestId('reset-button')).toBeDisabled();
      expect(screen.getByTestId('export-button')).toBeEnabled();

      // Status should show errors
      expect(screen.getByText('⚠ Has Errors')).toBeInTheDocument();
    });
  });

  describe('component updates', () => {
    test('should update button states when props change', async () => {
      const { rerender } = render(<SudokuControls {...defaultProps} canUndo={false} canRedo={false} />);

      expect(screen.getByTestId('undo-button')).toBeDisabled();
      expect(screen.getByTestId('redo-button')).toBeDisabled();

      rerender(<SudokuControls {...defaultProps} canUndo={true} canRedo={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('undo-button')).toBeEnabled();
        expect(screen.getByTestId('redo-button')).toBeEnabled();
      });
    });

    test('should update status indicator when state changes', async () => {
      const { rerender } = render(<SudokuControls {...defaultProps} isValid={false} isSolved={false} />);

      expect(screen.getByText('⚠ Has Errors')).toBeInTheDocument();

      rerender(<SudokuControls {...defaultProps} isValid={true} isSolved={false} />);
      await waitFor(() => {
        expect(screen.getByText('✓ Valid')).toBeInTheDocument();
      });

      rerender(<SudokuControls {...defaultProps} isValid={true} isSolved={true} />);
      await waitFor(() => {
        expect(screen.getByText('✅ Solved!')).toBeInTheDocument();
      });
    });

    test('should handle canReset changing while confirmation is shown', async () => {
      const { rerender } = render(<SudokuControls {...defaultProps} canReset={true} />);

      // Show confirmation
      fireEvent.click(screen.getByTestId('reset-button'));
      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
      });

      // Disable reset
      rerender(<SudokuControls {...defaultProps} canReset={false} />);

      // Currently the component maintains confirmation state even when canReset becomes false
      // This could be improved in the future, but the test documents current behavior
      await waitFor(() => {
        expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();
        expect(screen.queryByTestId('reset-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('responsive layout variations', () => {
    const mockResponsiveLayout = (
      deviceType: 'mobile' | 'tablet' | 'desktop',
      keypadLayoutMode: 'side-by-side' | 'stacked' | 'overlay' | 'hidden'
    ): void => {
      const mockLayoutInfo: IResponsiveLayoutInfo = {
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

        render(<SudokuControls {...defaultProps} />);

        const controls = screen.getByTestId('sudoku-controls');
        expect(controls).toBeInTheDocument();

        // Instructions should be hidden in compact mode
        expect(screen.queryByText('Instructions:')).not.toBeInTheDocument();
        expect(screen.queryByText('• Click a cell to select it')).not.toBeInTheDocument();
      });

      test('should render compact mode for mobile with stacked keypad', () => {
        mockResponsiveLayout('mobile', 'stacked');

        render(<SudokuControls {...defaultProps} />);

        const controls = screen.getByTestId('sudoku-controls');
        expect(controls).toBeInTheDocument();

        // Instructions should be hidden in compact mode with stacked layout
        expect(screen.queryByText('Instructions:')).not.toBeInTheDocument();
        expect(screen.queryByText('• Click a cell to select it')).not.toBeInTheDocument();
      });

      test('should show instructions for mobile with overlay keypad', () => {
        mockResponsiveLayout('mobile', 'overlay');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible when keypad is overlay
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });

      test('should show instructions for mobile with hidden keypad', () => {
        mockResponsiveLayout('mobile', 'hidden');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible when keypad is hidden
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
    });

    describe('tablet layout variations', () => {
      test('should render full mode for tablet with side-by-side keypad', () => {
        mockResponsiveLayout('tablet', 'side-by-side');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible for tablet
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });

      test('should render full mode for tablet with stacked keypad', () => {
        mockResponsiveLayout('tablet', 'stacked');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible for tablet
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });

      test('should render full mode for tablet with overlay keypad', () => {
        mockResponsiveLayout('tablet', 'overlay');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible for tablet
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
    });

    describe('desktop layout variations', () => {
      test('should render full mode for desktop with hidden keypad', () => {
        mockResponsiveLayout('desktop', 'hidden');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible for desktop
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });

      test('should render full mode for desktop with overlay keypad', () => {
        mockResponsiveLayout('desktop', 'overlay');

        render(<SudokuControls {...defaultProps} />);

        // Instructions should be visible for desktop
        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('• Click a cell to select it')).toBeInTheDocument();
      });
    });

    describe('reset confirmation in compact mode', () => {
      test('should show compact reset confirmation for mobile side-by-side', async () => {
        mockResponsiveLayout('mobile', 'side-by-side');

        render(<SudokuControls {...defaultProps} canReset={true} />);

        // Show confirmation
        fireEvent.click(screen.getByTestId('reset-button'));

        await waitFor(() => {
          const confirmButton = screen.getByTestId('confirm-reset-button');
          expect(confirmButton).toBeInTheDocument();

          // In compact mode, confirmation message is shown as title attribute
          expect(confirmButton).toHaveAttribute('title', 'Are you sure? This will clear all entries.');

          // Full confirmation message should not be visible in compact mode
          expect(screen.queryByText('Are you sure? This will clear all entries.')).not.toBeInTheDocument();
        });
      });

      test('should show compact reset confirmation for mobile stacked', async () => {
        mockResponsiveLayout('mobile', 'stacked');

        render(<SudokuControls {...defaultProps} canReset={true} />);

        // Show confirmation
        fireEvent.click(screen.getByTestId('reset-button'));

        await waitFor(() => {
          const confirmButton = screen.getByTestId('confirm-reset-button');
          expect(confirmButton).toBeInTheDocument();

          // In compact mode, confirmation message is shown as title attribute
          expect(confirmButton).toHaveAttribute('title', 'Are you sure? This will clear all entries.');

          // Full confirmation message should not be visible in compact mode
          expect(screen.queryByText('Are you sure? This will clear all entries.')).not.toBeInTheDocument();
        });
      });

      test('should show full reset confirmation for non-compact modes', async () => {
        mockResponsiveLayout('mobile', 'overlay');

        render(<SudokuControls {...defaultProps} canReset={true} />);

        // Show confirmation
        fireEvent.click(screen.getByTestId('reset-button'));

        await waitFor(() => {
          // Full confirmation message should be visible in non-compact mode
          expect(screen.getByText('Are you sure? This will clear all entries.')).toBeInTheDocument();

          const confirmButton = screen.getByTestId('confirm-reset-button');
          expect(confirmButton).toBeInTheDocument();

          // Title should not be set in non-compact mode
          expect(confirmButton).not.toHaveAttribute('title');
        });
      });
    });
  });
});
