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

// Mock must be hoisted before imports
jest.mock('../../../hooks/useResponsiveLayout');

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DualKeypad } from '../../../components/DualKeypad';
import { InputMode } from '../../../types';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';

// Create mock for useResponsiveLayout with a flexible implementation
const mockResponsiveLayout = {
  deviceType: 'mobile' as const,
  orientation: 'portrait' as const,
  keypadLayoutMode: 'side-by-side' as const,
  screenWidth: 400,
  screenHeight: 800,
  isTouchDevice: true,
  isSmallScreen: true,
  hasSpaceForDualKeypads: true
};

describe('DualKeypad', () => {
  const mockProps = {
    inputMode: 'notes' as InputMode,
    onInputModeChange: jest.fn(),
    onNotePress: jest.fn(),
    onValuePress: jest.fn(),
    onClearNotes: jest.fn(),
    onClearValues: jest.fn(),
    hasCellSelection: true,
    selectedCellCount: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default
    (useResponsiveLayout as jest.Mock).mockReturnValue(mockResponsiveLayout);
  });

  describe('Rendering and Visual Structure', () => {
    test('should render both keypads in side-by-side mode', () => {
      render(<DualKeypad {...mockProps} />);

      expect(screen.getByTestId('dual-keypad')).toBeInTheDocument();
      expect(screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(screen.getByTestId('number-keypad-values')).toBeInTheDocument();
    });

    test('should apply correct layout classes for side-by-side mode', () => {
      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-row');
      expect(container).toHaveClass('justify-center');
    });

    test('should apply correct layout classes for stacked mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'stacked'
      });

      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-col');
    });

    test('should apply compact mode styles when on small screen', () => {
      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      // Compact mode adds gap-2 and p-2 classes
      expect(container).toHaveClass('gap-2');
      expect(container).toHaveClass('p-2');
    });

    test('should apply custom className when provided', () => {
      render(<DualKeypad {...mockProps} className="custom-class" />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('custom-class');
    });

    test('should have proper ARIA labels for accessibility', () => {
      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Number input keypads');
    });
  });

  describe('Status Text Display', () => {
    test('should show status text for multi-selection', () => {
      render(<DualKeypad {...mockProps} selectedCellCount={3} />);

      expect(screen.getByText('3 cells selected')).toBeInTheDocument();
    });

    test('should not show status text for single cell selection', () => {
      render(<DualKeypad {...mockProps} selectedCellCount={1} />);

      expect(screen.queryByText(/cells? selected/)).not.toBeInTheDocument();
    });

    test('should not show status text for zero selected cells', () => {
      render(<DualKeypad {...mockProps} selectedCellCount={0} />);

      expect(screen.queryByText(/cells? selected/)).not.toBeInTheDocument();
    });
  });

  describe('Input Mode Handling', () => {
    test('should render in notes mode correctly', () => {
      render(<DualKeypad {...mockProps} inputMode="notes" />);

      // Both keypads should be rendered
      expect(screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(screen.getByTestId('number-keypad-values')).toBeInTheDocument();
    });

    test('should render in value mode correctly', () => {
      render(<DualKeypad {...mockProps} inputMode="value" />);

      // Both keypads should be rendered
      expect(screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(screen.getByTestId('number-keypad-values')).toBeInTheDocument();
    });

    test('should show mode toggle buttons in overlay mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });

      render(<DualKeypad {...mockProps} />);

      // Click overlay toggle to show the keypad
      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      // Mode toggle buttons should be visible - look for buttons with emoji + text
      const buttons = screen.getAllByRole('button');
      const notesButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      const valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');

      expect(notesButton).toBeInTheDocument();
      expect(valuesButton).toBeInTheDocument();
    });

    test('should call onInputModeChange when mode toggle is clicked in overlay mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });

      render(<DualKeypad {...mockProps} inputMode="notes" />);

      // Show overlay
      fireEvent.click(screen.getByTestId('dual-keypad-overlay-toggle'));

      // Click value mode button - look for button with emoji + text
      const buttons = screen.getAllByRole('button');
      const valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      fireEvent.click(valuesButton as HTMLElement);

      expect(mockProps.onInputModeChange).toHaveBeenCalledWith('value');
    });

    test('should not show mode toggle in side-by-side mode', () => {
      render(<DualKeypad {...mockProps} />);

      // Mode toggle buttons should not be present in side-by-side mode
      // Check that there's no button with exact text "📝 Notes" or "✏️ Values"
      const buttons = screen.getAllByRole('button');
      const notesToggleButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      const valuesToggleButton = buttons.find((btn) => btn.textContent === '✏️ Values');

      expect(notesToggleButton).toBeUndefined();
      expect(valuesToggleButton).toBeUndefined();
    });

    test('should not show mode toggle in stacked mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'stacked'
      });

      render(<DualKeypad {...mockProps} />);

      // Mode toggle buttons should not be present in stacked mode
      // Check that there's no button with exact text "📝 Notes" or "✏️ Values"
      const buttons = screen.getAllByRole('button');
      const notesToggleButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      const valuesToggleButton = buttons.find((btn) => btn.textContent === '✏️ Values');

      expect(notesToggleButton).toBeUndefined();
      expect(valuesToggleButton).toBeUndefined();
    });
  });

  describe('User Interactions - Number Input', () => {
    test('should handle note press', () => {
      render(<DualKeypad {...mockProps} />);

      const noteButton = screen.getByTestId('keypad-notes-1');
      fireEvent.click(noteButton);

      expect(mockProps.onNotePress).toHaveBeenCalledWith(1);
    });

    test('should handle value press', () => {
      render(<DualKeypad {...mockProps} />);

      const valueButton = screen.getByTestId('keypad-values-2');
      fireEvent.click(valueButton);

      expect(mockProps.onValuePress).toHaveBeenCalledWith(2);
    });

    test('should handle multiple note presses', () => {
      render(<DualKeypad {...mockProps} />);

      const noteButton1 = screen.getByTestId('keypad-notes-1');
      const noteButton2 = screen.getByTestId('keypad-notes-5');
      const noteButton3 = screen.getByTestId('keypad-notes-9');

      fireEvent.click(noteButton1);
      fireEvent.click(noteButton2);
      fireEvent.click(noteButton3);

      expect(mockProps.onNotePress).toHaveBeenCalledTimes(3);
      expect(mockProps.onNotePress).toHaveBeenNthCalledWith(1, 1);
      expect(mockProps.onNotePress).toHaveBeenNthCalledWith(2, 5);
      expect(mockProps.onNotePress).toHaveBeenNthCalledWith(3, 9);
    });

    test('should handle multiple value presses', () => {
      render(<DualKeypad {...mockProps} />);

      const valueButton4 = screen.getByTestId('keypad-values-4');
      const valueButton7 = screen.getByTestId('keypad-values-7');

      fireEvent.click(valueButton4);
      fireEvent.click(valueButton7);

      expect(mockProps.onValuePress).toHaveBeenCalledTimes(2);
      expect(mockProps.onValuePress).toHaveBeenNthCalledWith(1, 4);
      expect(mockProps.onValuePress).toHaveBeenNthCalledWith(2, 7);
    });
  });

  describe('User Interactions - Clear Functions', () => {
    test('should handle clear notes', () => {
      render(<DualKeypad {...mockProps} />);

      const clearNotesButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.click(clearNotesButton);

      expect(mockProps.onClearNotes).toHaveBeenCalled();
    });

    test('should handle clear values', () => {
      render(<DualKeypad {...mockProps} />);

      const clearValuesButton = screen.getByTestId('keypad-values-clear');
      fireEvent.click(clearValuesButton);

      expect(mockProps.onClearValues).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    test('should disable keypads when no cell selection', () => {
      render(<DualKeypad {...mockProps} hasCellSelection={false} />);

      const noteButtons = screen.getAllByTestId(/keypad-notes-\d/);
      const valueButtons = screen.getAllByTestId(/keypad-values-\d/);

      noteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });

      valueButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    test('should disable all controls when disabled prop is true', () => {
      render(<DualKeypad {...mockProps} disabled={true} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('opacity-50');
      expect(container).toHaveClass('pointer-events-none');
    });

    test('should not call callbacks when disabled', () => {
      render(<DualKeypad {...mockProps} disabled={true} />);

      const noteButton = screen.getByTestId('keypad-notes-1');
      const valueButton = screen.getByTestId('keypad-values-2');
      const clearNotesButton = screen.getByTestId('keypad-notes-clear');
      const clearValuesButton = screen.getByTestId('keypad-values-clear');

      fireEvent.click(noteButton);
      fireEvent.click(valueButton);
      fireEvent.click(clearNotesButton);
      fireEvent.click(clearValuesButton);

      expect(mockProps.onNotePress).not.toHaveBeenCalled();
      expect(mockProps.onValuePress).not.toHaveBeenCalled();
      expect(mockProps.onClearNotes).not.toHaveBeenCalled();
      expect(mockProps.onClearValues).not.toHaveBeenCalled();
    });
  });

  describe('Overlay Mode Functionality', () => {
    beforeEach(() => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
    });

    test('should hide keypad initially in overlay mode', () => {
      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      // Container exists but is hidden via display: none
      expect(container).toHaveStyle({ display: 'none' });
    });

    test('should show overlay toggle button in overlay mode', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toBeInTheDocument();
      expect(overlayToggle).toHaveAttribute('aria-label', 'Show number keypad');
    });

    test('should show keypad when overlay toggle is clicked', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'flex' });
    });

    test('should hide keypad when overlay toggle is clicked again', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');

      // Show
      fireEvent.click(overlayToggle);
      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'flex' });

      // Hide
      fireEvent.click(overlayToggle);
      expect(container).toHaveStyle({ display: 'none' });
    });

    test('should show backdrop when overlay is visible', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      const backdrop = screen.getByTestId('dual-keypad-overlay-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    test('should hide keypad when backdrop is clicked', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      const backdrop = screen.getByTestId('dual-keypad-overlay-backdrop');
      fireEvent.click(backdrop);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'none' });
    });

    test('should show close button in overlay when visible', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      const closeButton = screen.getByTestId('dual-keypad-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close keypad overlay');
    });

    test('should hide keypad when close button is clicked', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      const closeButton = screen.getByTestId('dual-keypad-close');
      fireEvent.click(closeButton);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'none' });
    });

    test('should update overlay toggle button aria-label based on visibility', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toHaveAttribute('aria-label', 'Show number keypad');

      fireEvent.click(overlayToggle);
      expect(overlayToggle).toHaveAttribute('aria-label', 'Hide number keypad');
    });

    test('should apply overlay-specific container classes', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('bottom-4');
      expect(container).toHaveClass('left-1/2');
      expect(container).toHaveClass('transform');
      expect(container).toHaveClass('-translate-x-1/2');
      expect(container).toHaveClass('z-50');
    });

    test('should not show overlay toggle when showOverlayToggle is false', () => {
      render(<DualKeypad {...mockProps} showOverlayToggle={false} />);

      expect(screen.queryByTestId('dual-keypad-overlay-toggle')).not.toBeInTheDocument();
    });
  });

  describe('Hidden Mode Functionality', () => {
    beforeEach(() => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'hidden'
      });
    });

    test('should hide keypad in hidden mode', () => {
      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'none' });
    });

    test('should show overlay toggle button in hidden mode', () => {
      render(<DualKeypad {...mockProps} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toBeInTheDocument();
    });

    test('should keep keypad hidden even when overlay toggle is clicked', () => {
      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      // Initially hidden
      expect(container).toHaveStyle({ display: 'none' });

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      // Should still be hidden - hidden mode always hides keypad
      expect(container).toHaveStyle({ display: 'none' });
    });
  });

  describe('Force Layout Mode', () => {
    test('should use forceLayoutMode when provided', () => {
      // Default mock has side-by-side, but we force overlay
      render(<DualKeypad {...mockProps} forceLayoutMode="overlay" />);

      const container = screen.getByTestId('dual-keypad');
      // Should be hidden initially (overlay behavior)
      expect(container).toHaveStyle({ display: 'none' });

      // Should have overlay toggle
      expect(screen.getByTestId('dual-keypad-overlay-toggle')).toBeInTheDocument();
    });

    test('should override responsive layout with forceLayoutMode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'side-by-side'
      });

      render(<DualKeypad {...mockProps} forceLayoutMode="stacked" />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-col');
      expect(container).not.toHaveClass('flex-row');
    });
  });

  describe('Responsive Layout Integration', () => {
    test('should use compact mode when isSmallScreen is true', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        isSmallScreen: true
      });

      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('gap-2');
      expect(container).toHaveClass('p-2');
    });

    test('should not use compact mode when isSmallScreen is false', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        isSmallScreen: false
      });

      render(<DualKeypad {...mockProps} />);

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('gap-3');
      expect(container).toHaveClass('p-3');
    });

    test('should use compact mode in overlay layout regardless of screen size', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay',
        isSmallScreen: false
      });

      render(<DualKeypad {...mockProps} />);

      // Show overlay
      fireEvent.click(screen.getByTestId('dual-keypad-overlay-toggle'));

      const container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('gap-2');
      expect(container).toHaveClass('p-2');
    });
  });

  describe('Interaction Flow Scenarios', () => {
    test('should allow switching between note and value input in overlay mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });

      render(<DualKeypad {...mockProps} inputMode="notes" />);

      // Show overlay
      fireEvent.click(screen.getByTestId('dual-keypad-overlay-toggle'));

      // Enter a note
      fireEvent.click(screen.getByTestId('keypad-notes-5'));
      expect(mockProps.onNotePress).toHaveBeenCalledWith(5);

      // Switch to value mode - look for button with emoji + text
      const buttons = screen.getAllByRole('button');
      const valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      fireEvent.click(valuesButton as HTMLElement);
      expect(mockProps.onInputModeChange).toHaveBeenCalledWith('value');

      // Enter a value
      fireEvent.click(screen.getByTestId('keypad-values-7'));
      expect(mockProps.onValuePress).toHaveBeenCalledWith(7);
    });

    test('should allow using both keypads simultaneously in side-by-side mode', () => {
      render(<DualKeypad {...mockProps} />);

      // Click note keypad
      fireEvent.click(screen.getByTestId('keypad-notes-3'));
      expect(mockProps.onNotePress).toHaveBeenCalledWith(3);

      // Click value keypad
      fireEvent.click(screen.getByTestId('keypad-values-8'));
      expect(mockProps.onValuePress).toHaveBeenCalledWith(8);

      // Both callbacks should have been called
      expect(mockProps.onNotePress).toHaveBeenCalledTimes(1);
      expect(mockProps.onValuePress).toHaveBeenCalledTimes(1);
    });

    test('should handle clear operations for both keypads', () => {
      render(<DualKeypad {...mockProps} />);

      // Clear notes
      fireEvent.click(screen.getByTestId('keypad-notes-clear'));
      expect(mockProps.onClearNotes).toHaveBeenCalledTimes(1);

      // Clear values
      fireEvent.click(screen.getByTestId('keypad-values-clear'));
      expect(mockProps.onClearValues).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large selectedCellCount', () => {
      render(<DualKeypad {...mockProps} selectedCellCount={999} />);

      expect(screen.getByText('999 cells selected')).toBeInTheDocument();
    });

    test('should handle zero selectedCellCount', () => {
      render(<DualKeypad {...mockProps} selectedCellCount={0} />);

      expect(screen.queryByText(/cells? selected/)).not.toBeInTheDocument();
    });

    test('should handle switching layout modes dynamically', () => {
      const { rerender } = render(<DualKeypad {...mockProps} forceLayoutMode="side-by-side" />);

      let container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-row');

      rerender(<DualKeypad {...mockProps} forceLayoutMode="stacked" />);
      container = screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-col');
      expect(container).not.toHaveClass('flex-row');
    });

    test('should handle disabled state in overlay mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });

      render(<DualKeypad {...mockProps} disabled={true} />);

      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toBeDisabled();
      expect(overlayToggle).toHaveClass('opacity-50');
      expect(overlayToggle).toHaveClass('cursor-not-allowed');
    });

    test('should show disabled styling on mode toggle buttons when disabled in overlay mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });

      const { rerender } = render(<DualKeypad {...mockProps} disabled={false} />);

      // Open overlay first
      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      // Get mode toggle buttons
      let buttons = screen.getAllByRole('button');
      let notesButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      let valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');

      // Initially not disabled
      expect(notesButton).not.toHaveClass('opacity-50');
      expect(valuesButton).not.toHaveClass('opacity-50');

      // Re-render with disabled=true
      rerender(<DualKeypad {...mockProps} disabled={true} />);

      // Overlay should still be visible, check mode toggle buttons for disabled styling
      buttons = screen.getAllByRole('button');
      notesButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');

      expect(notesButton).toHaveClass('opacity-50');
      expect(notesButton).toHaveClass('cursor-not-allowed');
      expect(valuesButton).toHaveClass('opacity-50');
      expect(valuesButton).toHaveClass('cursor-not-allowed');
    });

    test('should show status text with stacked layout styling when multiselect in overlay', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });

      render(<DualKeypad {...mockProps} selectedCellCount={3} />);

      // Open overlay
      const overlayToggle = screen.getByTestId('dual-keypad-overlay-toggle');
      fireEvent.click(overlayToggle);

      // Status text should be present
      const statusText = screen.getByText('3 cells selected');
      expect(statusText).toBeInTheDocument();
    });

    test('should apply stacked layout styling to status text when multiselect in stacked mode', () => {
      (useResponsiveLayout as jest.Mock).mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'stacked'
      });

      render(<DualKeypad {...mockProps} selectedCellCount={3} />);

      // Status text should be present with stacked layout styling
      const statusText = screen.getByText('3 cells selected');
      expect(statusText).toBeInTheDocument();
      expect(statusText).toHaveClass('mb-2'); // stacked layout uses mb-2
    });
  });
});
