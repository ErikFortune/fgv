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

// Mock the useResponsiveLayout hook
jest.mock('../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    deviceType: 'desktop',
    orientation: 'landscape',
    keypadLayoutMode: 'hidden',
    screenWidth: 1024,
    screenHeight: 768,
    isTouchDevice: false,
    isSmallScreen: false,
    hasSpaceForDualKeypads: true
  })
}));

import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompactControlRibbon } from '../../../components/CompactControlRibbon';

describe('CompactControlRibbon', () => {
  const mockValidationErrors = [
    { type: 'duplicate-row', cellId: 'A1', message: 'Duplicate in row' },
    { type: 'duplicate-column', cellId: 'B2', message: 'Duplicate in column' }
  ];

  const mockProps = {
    canUndo: true,
    canRedo: true,
    canReset: true,
    isValid: false,
    isSolved: false,
    validationErrors: mockValidationErrors,
    onUndo: jest.fn(),
    onRedo: jest.fn(),
    onReset: jest.fn(),
    onExport: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render compact control ribbon', () => {
    render(<CompactControlRibbon {...mockProps} />);

    expect(screen.getByTestId('compact-control-ribbon')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('compact-export-button')).toBeInTheDocument();
    expect(screen.getByTestId('compact-reset-button')).toBeInTheDocument();
    expect(screen.getByTestId('compact-undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('compact-redo-button')).toBeInTheDocument();
  });

  test('should show error count in status indicator when puzzle has errors', () => {
    render(<CompactControlRibbon {...mockProps} />);

    const statusIndicator = screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveTextContent('2');
    expect(statusIndicator).toHaveAttribute('title', '2 validation errors');
  });

  test('should show checkmark when puzzle is valid', () => {
    render(<CompactControlRibbon {...mockProps} isValid={true} validationErrors={[]} />);

    const statusIndicator = screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveTextContent('✓');
    expect(statusIndicator).toHaveAttribute('title', 'Puzzle is valid');
  });

  test('should show checkmark when puzzle is solved', () => {
    render(<CompactControlRibbon {...mockProps} isSolved={true} isValid={true} validationErrors={[]} />);

    const statusIndicator = screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveTextContent('✓');
    expect(statusIndicator).toHaveAttribute('title', 'Puzzle solved!');
  });

  test('should handle export button click', () => {
    render(<CompactControlRibbon {...mockProps} />);

    const exportButton = screen.getByTestId('compact-export-button');
    fireEvent.click(exportButton);

    expect(mockProps.onExport).toHaveBeenCalled();
  });

  test('should handle undo button click when enabled', () => {
    render(<CompactControlRibbon {...mockProps} />);

    const undoButton = screen.getByTestId('compact-undo-button');
    fireEvent.click(undoButton);

    expect(mockProps.onUndo).toHaveBeenCalled();
  });

  test('should handle redo button click when enabled', () => {
    render(<CompactControlRibbon {...mockProps} />);

    const redoButton = screen.getByTestId('compact-redo-button');
    fireEvent.click(redoButton);

    expect(mockProps.onRedo).toHaveBeenCalled();
  });

  test('should disable undo button when canUndo is false', () => {
    render(<CompactControlRibbon {...mockProps} canUndo={false} />);

    const undoButton = screen.getByTestId('compact-undo-button');
    expect(undoButton).toBeDisabled();
  });

  test('should disable redo button when canRedo is false', () => {
    render(<CompactControlRibbon {...mockProps} canRedo={false} />);

    const redoButton = screen.getByTestId('compact-redo-button');
    expect(redoButton).toBeDisabled();
  });

  test('should handle reset confirmation flow', async () => {
    render(<CompactControlRibbon {...mockProps} />);

    // First click should show confirmation
    const resetButton = screen.getByTestId('compact-reset-button');
    fireEvent.click(resetButton);

    // Should show confirm and cancel buttons
    await waitFor(() => {
      expect(screen.getByTestId('compact-confirm-reset-button')).toBeInTheDocument();
      expect(screen.getByTestId('compact-cancel-reset-button')).toBeInTheDocument();
    });

    // Click confirm to actually reset
    const confirmButton = await screen.findByTestId('compact-confirm-reset-button');
    fireEvent.click(confirmButton);

    expect(mockProps.onReset).toHaveBeenCalled();
  });

  test('should handle reset cancellation', async () => {
    render(<CompactControlRibbon {...mockProps} />);

    // First click to enter confirmation mode
    const resetButton = screen.getByTestId('compact-reset-button');
    fireEvent.click(resetButton);

    // Click cancel
    const cancelButton = await screen.findByTestId('compact-cancel-reset-button');
    fireEvent.click(cancelButton);

    // Should return to normal reset button
    await waitFor(() => {
      expect(screen.getByTestId('compact-reset-button')).toBeInTheDocument();
      expect(mockProps.onReset).not.toHaveBeenCalled();
    });
  });

  test('should auto-hide reset confirmation after timeout', async () => {
    jest.useFakeTimers();
    render(<CompactControlRibbon {...mockProps} />);

    // Enter confirmation mode
    const resetButton = screen.getByTestId('compact-reset-button');
    fireEvent.click(resetButton);

    // Verify confirmation appears
    await screen.findByTestId('compact-confirm-reset-button');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Verify return to normal state
    await waitFor(() => {
      expect(screen.getByTestId('compact-reset-button')).toBeInTheDocument();
      expect(screen.queryByTestId('compact-confirm-reset-button')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('should disable reset button when canReset is false', () => {
    render(<CompactControlRibbon {...mockProps} canReset={false} />);

    const resetButton = screen.getByTestId('compact-reset-button');
    expect(resetButton).toBeDisabled();
  });
});
