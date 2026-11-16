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
// Mock must be hoisted before imports
jest.mock('../../../hooks/useResponsiveLayout');
const react_1 = tslib_1.__importDefault(require('react'));
const react_2 = require('@testing-library/react');
const DualKeypad_1 = require('../../../components/DualKeypad');
const useResponsiveLayout_1 = require('../../../hooks/useResponsiveLayout');
// Create mock for useResponsiveLayout with a flexible implementation
const mockResponsiveLayout = {
  deviceType: 'mobile',
  orientation: 'portrait',
  keypadLayoutMode: 'side-by-side',
  screenWidth: 400,
  screenHeight: 800,
  isTouchDevice: true,
  isSmallScreen: true,
  hasSpaceForDualKeypads: true
};
describe('DualKeypad', () => {
  const mockProps = {
    inputMode: 'notes',
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
    useResponsiveLayout_1.useResponsiveLayout.mockReturnValue(mockResponsiveLayout);
  });
  describe('Rendering and Visual Structure', () => {
    test('should render both keypads in side-by-side mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      expect(react_2.screen.getByTestId('dual-keypad')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('number-keypad-values')).toBeInTheDocument();
    });
    test('should apply correct layout classes for side-by-side mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-row');
      expect(container).toHaveClass('justify-center');
    });
    test('should apply correct layout classes for stacked mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'stacked'
      });
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-col');
    });
    test('should apply compact mode styles when on small screen', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      // Compact mode adds gap-2 and p-2 classes
      expect(container).toHaveClass('gap-2');
      expect(container).toHaveClass('p-2');
    });
    test('should apply custom className when provided', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, className: 'custom-class' })
      );
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('custom-class');
    });
    test('should have proper ARIA labels for accessibility', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Number input keypads');
    });
  });
  describe('Status Text Display', () => {
    test('should show status text for multi-selection', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 3 })
      );
      expect(react_2.screen.getByText('3 cells selected')).toBeInTheDocument();
    });
    test('should not show status text for single cell selection', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 1 })
      );
      expect(react_2.screen.queryByText(/cells? selected/)).not.toBeInTheDocument();
    });
    test('should not show status text for zero selected cells', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 0 })
      );
      expect(react_2.screen.queryByText(/cells? selected/)).not.toBeInTheDocument();
    });
  });
  describe('Input Mode Handling', () => {
    test('should render in notes mode correctly', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, inputMode: 'notes' })
      );
      // Both keypads should be rendered
      expect(react_2.screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('number-keypad-values')).toBeInTheDocument();
    });
    test('should render in value mode correctly', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, inputMode: 'value' })
      );
      // Both keypads should be rendered
      expect(react_2.screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('number-keypad-values')).toBeInTheDocument();
    });
    test('should show mode toggle buttons in overlay mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      // Click overlay toggle to show the keypad
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      // Mode toggle buttons should be visible - look for buttons with emoji + text
      const buttons = react_2.screen.getAllByRole('button');
      const notesButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      const valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      expect(notesButton).toBeInTheDocument();
      expect(valuesButton).toBeInTheDocument();
    });
    test('should call onInputModeChange when mode toggle is clicked in overlay mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, inputMode: 'notes' })
      );
      // Show overlay
      react_2.fireEvent.click(react_2.screen.getByTestId('dual-keypad-overlay-toggle'));
      // Click value mode button - look for button with emoji + text
      const buttons = react_2.screen.getAllByRole('button');
      const valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      react_2.fireEvent.click(valuesButton);
      expect(mockProps.onInputModeChange).toHaveBeenCalledWith('value');
    });
    test('should not show mode toggle in side-by-side mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      // Mode toggle buttons should not be present in side-by-side mode
      // Check that there's no button with exact text "📝 Notes" or "✏️ Values"
      const buttons = react_2.screen.getAllByRole('button');
      const notesToggleButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      const valuesToggleButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      expect(notesToggleButton).toBeUndefined();
      expect(valuesToggleButton).toBeUndefined();
    });
    test('should not show mode toggle in stacked mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'stacked'
      });
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      // Mode toggle buttons should not be present in stacked mode
      // Check that there's no button with exact text "📝 Notes" or "✏️ Values"
      const buttons = react_2.screen.getAllByRole('button');
      const notesToggleButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      const valuesToggleButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      expect(notesToggleButton).toBeUndefined();
      expect(valuesToggleButton).toBeUndefined();
    });
  });
  describe('User Interactions - Number Input', () => {
    test('should handle note press', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const noteButton = react_2.screen.getByTestId('keypad-notes-1');
      react_2.fireEvent.click(noteButton);
      expect(mockProps.onNotePress).toHaveBeenCalledWith(1);
    });
    test('should handle value press', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const valueButton = react_2.screen.getByTestId('keypad-values-2');
      react_2.fireEvent.click(valueButton);
      expect(mockProps.onValuePress).toHaveBeenCalledWith(2);
    });
    test('should handle multiple note presses', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const noteButton1 = react_2.screen.getByTestId('keypad-notes-1');
      const noteButton2 = react_2.screen.getByTestId('keypad-notes-5');
      const noteButton3 = react_2.screen.getByTestId('keypad-notes-9');
      react_2.fireEvent.click(noteButton1);
      react_2.fireEvent.click(noteButton2);
      react_2.fireEvent.click(noteButton3);
      expect(mockProps.onNotePress).toHaveBeenCalledTimes(3);
      expect(mockProps.onNotePress).toHaveBeenNthCalledWith(1, 1);
      expect(mockProps.onNotePress).toHaveBeenNthCalledWith(2, 5);
      expect(mockProps.onNotePress).toHaveBeenNthCalledWith(3, 9);
    });
    test('should handle multiple value presses', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const valueButton4 = react_2.screen.getByTestId('keypad-values-4');
      const valueButton7 = react_2.screen.getByTestId('keypad-values-7');
      react_2.fireEvent.click(valueButton4);
      react_2.fireEvent.click(valueButton7);
      expect(mockProps.onValuePress).toHaveBeenCalledTimes(2);
      expect(mockProps.onValuePress).toHaveBeenNthCalledWith(1, 4);
      expect(mockProps.onValuePress).toHaveBeenNthCalledWith(2, 7);
    });
  });
  describe('User Interactions - Clear Functions', () => {
    test('should handle clear notes', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const clearNotesButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(clearNotesButton);
      expect(mockProps.onClearNotes).toHaveBeenCalled();
    });
    test('should handle clear values', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const clearValuesButton = react_2.screen.getByTestId('keypad-values-clear');
      react_2.fireEvent.click(clearValuesButton);
      expect(mockProps.onClearValues).toHaveBeenCalled();
    });
  });
  describe('Disabled State', () => {
    test('should disable keypads when no cell selection', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, hasCellSelection: false })
      );
      const noteButtons = react_2.screen.getAllByTestId(/keypad-notes-\d/);
      const valueButtons = react_2.screen.getAllByTestId(/keypad-values-\d/);
      noteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
      valueButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
    test('should disable all controls when disabled prop is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, disabled: true })
      );
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('opacity-50');
      expect(container).toHaveClass('pointer-events-none');
    });
    test('should not call callbacks when disabled', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, disabled: true })
      );
      const noteButton = react_2.screen.getByTestId('keypad-notes-1');
      const valueButton = react_2.screen.getByTestId('keypad-values-2');
      const clearNotesButton = react_2.screen.getByTestId('keypad-notes-clear');
      const clearValuesButton = react_2.screen.getByTestId('keypad-values-clear');
      react_2.fireEvent.click(noteButton);
      react_2.fireEvent.click(valueButton);
      react_2.fireEvent.click(clearNotesButton);
      react_2.fireEvent.click(clearValuesButton);
      expect(mockProps.onNotePress).not.toHaveBeenCalled();
      expect(mockProps.onValuePress).not.toHaveBeenCalled();
      expect(mockProps.onClearNotes).not.toHaveBeenCalled();
      expect(mockProps.onClearValues).not.toHaveBeenCalled();
    });
  });
  describe('Overlay Mode Functionality', () => {
    beforeEach(() => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
    });
    test('should hide keypad initially in overlay mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      // Container exists but is hidden via display: none
      expect(container).toHaveStyle({ display: 'none' });
    });
    test('should show overlay toggle button in overlay mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toBeInTheDocument();
      expect(overlayToggle).toHaveAttribute('aria-label', 'Show number keypad');
    });
    test('should show keypad when overlay toggle is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'flex' });
    });
    test('should hide keypad when overlay toggle is clicked again', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      // Show
      react_2.fireEvent.click(overlayToggle);
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'flex' });
      // Hide
      react_2.fireEvent.click(overlayToggle);
      expect(container).toHaveStyle({ display: 'none' });
    });
    test('should show backdrop when overlay is visible', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      const backdrop = react_2.screen.getByTestId('dual-keypad-overlay-backdrop');
      expect(backdrop).toBeInTheDocument();
    });
    test('should hide keypad when backdrop is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      const backdrop = react_2.screen.getByTestId('dual-keypad-overlay-backdrop');
      react_2.fireEvent.click(backdrop);
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'none' });
    });
    test('should show close button in overlay when visible', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      const closeButton = react_2.screen.getByTestId('dual-keypad-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close keypad overlay');
    });
    test('should hide keypad when close button is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      const closeButton = react_2.screen.getByTestId('dual-keypad-close');
      react_2.fireEvent.click(closeButton);
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'none' });
    });
    test('should update overlay toggle button aria-label based on visibility', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toHaveAttribute('aria-label', 'Show number keypad');
      react_2.fireEvent.click(overlayToggle);
      expect(overlayToggle).toHaveAttribute('aria-label', 'Hide number keypad');
    });
    test('should apply overlay-specific container classes', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('bottom-4');
      expect(container).toHaveClass('left-1/2');
      expect(container).toHaveClass('transform');
      expect(container).toHaveClass('-translate-x-1/2');
      expect(container).toHaveClass('z-50');
    });
    test('should not show overlay toggle when showOverlayToggle is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, showOverlayToggle: false })
      );
      expect(react_2.screen.queryByTestId('dual-keypad-overlay-toggle')).not.toBeInTheDocument();
    });
  });
  describe('Hidden Mode Functionality', () => {
    beforeEach(() => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'hidden'
      });
    });
    test('should hide keypad in hidden mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveStyle({ display: 'none' });
    });
    test('should show overlay toggle button in hidden mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toBeInTheDocument();
    });
    test('should keep keypad hidden even when overlay toggle is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      // Initially hidden
      expect(container).toHaveStyle({ display: 'none' });
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      // Should still be hidden - hidden mode always hides keypad
      expect(container).toHaveStyle({ display: 'none' });
    });
  });
  describe('Force Layout Mode', () => {
    test('should use forceLayoutMode when provided', () => {
      // Default mock has side-by-side, but we force overlay
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, forceLayoutMode: 'overlay' })
      );
      const container = react_2.screen.getByTestId('dual-keypad');
      // Should be hidden initially (overlay behavior)
      expect(container).toHaveStyle({ display: 'none' });
      // Should have overlay toggle
      expect(react_2.screen.getByTestId('dual-keypad-overlay-toggle')).toBeInTheDocument();
    });
    test('should override responsive layout with forceLayoutMode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'side-by-side'
      });
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, forceLayoutMode: 'stacked' })
      );
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-col');
      expect(container).not.toHaveClass('flex-row');
    });
  });
  describe('Responsive Layout Integration', () => {
    test('should use compact mode when isSmallScreen is true', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        isSmallScreen: true
      });
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('gap-2');
      expect(container).toHaveClass('p-2');
    });
    test('should not use compact mode when isSmallScreen is false', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        isSmallScreen: false
      });
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('gap-3');
      expect(container).toHaveClass('p-3');
    });
    test('should use compact mode in overlay layout regardless of screen size', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay',
        isSmallScreen: false
      });
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      // Show overlay
      react_2.fireEvent.click(react_2.screen.getByTestId('dual-keypad-overlay-toggle'));
      const container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('gap-2');
      expect(container).toHaveClass('p-2');
    });
  });
  describe('Interaction Flow Scenarios', () => {
    test('should allow switching between note and value input in overlay mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, inputMode: 'notes' })
      );
      // Show overlay
      react_2.fireEvent.click(react_2.screen.getByTestId('dual-keypad-overlay-toggle'));
      // Enter a note
      react_2.fireEvent.click(react_2.screen.getByTestId('keypad-notes-5'));
      expect(mockProps.onNotePress).toHaveBeenCalledWith(5);
      // Switch to value mode - look for button with emoji + text
      const buttons = react_2.screen.getAllByRole('button');
      const valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      react_2.fireEvent.click(valuesButton);
      expect(mockProps.onInputModeChange).toHaveBeenCalledWith('value');
      // Enter a value
      react_2.fireEvent.click(react_2.screen.getByTestId('keypad-values-7'));
      expect(mockProps.onValuePress).toHaveBeenCalledWith(7);
    });
    test('should allow using both keypads simultaneously in side-by-side mode', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      // Click note keypad
      react_2.fireEvent.click(react_2.screen.getByTestId('keypad-notes-3'));
      expect(mockProps.onNotePress).toHaveBeenCalledWith(3);
      // Click value keypad
      react_2.fireEvent.click(react_2.screen.getByTestId('keypad-values-8'));
      expect(mockProps.onValuePress).toHaveBeenCalledWith(8);
      // Both callbacks should have been called
      expect(mockProps.onNotePress).toHaveBeenCalledTimes(1);
      expect(mockProps.onValuePress).toHaveBeenCalledTimes(1);
    });
    test('should handle clear operations for both keypads', () => {
      (0, react_2.render)(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps }));
      // Clear notes
      react_2.fireEvent.click(react_2.screen.getByTestId('keypad-notes-clear'));
      expect(mockProps.onClearNotes).toHaveBeenCalledTimes(1);
      // Clear values
      react_2.fireEvent.click(react_2.screen.getByTestId('keypad-values-clear'));
      expect(mockProps.onClearValues).toHaveBeenCalledTimes(1);
    });
  });
  describe('Edge Cases', () => {
    test('should handle very large selectedCellCount', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 999 })
      );
      expect(react_2.screen.getByText('999 cells selected')).toBeInTheDocument();
    });
    test('should handle zero selectedCellCount', () => {
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 0 })
      );
      expect(react_2.screen.queryByText(/cells? selected/)).not.toBeInTheDocument();
    });
    test('should handle switching layout modes dynamically', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, {
          ...mockProps,
          forceLayoutMode: 'side-by-side'
        })
      );
      let container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-row');
      rerender(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, forceLayoutMode: 'stacked' })
      );
      container = react_2.screen.getByTestId('dual-keypad');
      expect(container).toHaveClass('flex-col');
      expect(container).not.toHaveClass('flex-row');
    });
    test('should handle disabled state in overlay mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, disabled: true })
      );
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      expect(overlayToggle).toBeDisabled();
      expect(overlayToggle).toHaveClass('opacity-50');
      expect(overlayToggle).toHaveClass('cursor-not-allowed');
    });
    test('should show disabled styling on mode toggle buttons when disabled in overlay mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, disabled: false })
      );
      // Open overlay first
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      // Get mode toggle buttons
      let buttons = react_2.screen.getAllByRole('button');
      let notesButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      let valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      // Initially not disabled
      expect(notesButton).not.toHaveClass('opacity-50');
      expect(valuesButton).not.toHaveClass('opacity-50');
      // Re-render with disabled=true
      rerender(react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, disabled: true }));
      // Overlay should still be visible, check mode toggle buttons for disabled styling
      buttons = react_2.screen.getAllByRole('button');
      notesButton = buttons.find((btn) => btn.textContent === '📝 Notes');
      valuesButton = buttons.find((btn) => btn.textContent === '✏️ Values');
      expect(notesButton).toHaveClass('opacity-50');
      expect(notesButton).toHaveClass('cursor-not-allowed');
      expect(valuesButton).toHaveClass('opacity-50');
      expect(valuesButton).toHaveClass('cursor-not-allowed');
    });
    test('should show status text with stacked layout styling when multiselect in overlay', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'overlay'
      });
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 3 })
      );
      // Open overlay
      const overlayToggle = react_2.screen.getByTestId('dual-keypad-overlay-toggle');
      react_2.fireEvent.click(overlayToggle);
      // Status text should be present
      const statusText = react_2.screen.getByText('3 cells selected');
      expect(statusText).toBeInTheDocument();
    });
    test('should apply stacked layout styling to status text when multiselect in stacked mode', () => {
      useResponsiveLayout_1.useResponsiveLayout.mockReturnValue({
        ...mockResponsiveLayout,
        keypadLayoutMode: 'stacked'
      });
      (0, react_2.render)(
        react_1.default.createElement(DualKeypad_1.DualKeypad, { ...mockProps, selectedCellCount: 3 })
      );
      // Status text should be present with stacked layout styling
      const statusText = react_2.screen.getByText('3 cells selected');
      expect(statusText).toBeInTheDocument();
      expect(statusText).toHaveClass('mb-2'); // stacked layout uses mb-2
    });
  });
});
//# sourceMappingURL=DualKeypad.test.js.map
