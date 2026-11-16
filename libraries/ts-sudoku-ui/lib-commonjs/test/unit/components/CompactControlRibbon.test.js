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
// Mock the useResponsiveLayout hook
const mockUseResponsiveLayout = jest.fn();
jest.mock('../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => mockUseResponsiveLayout()
}));
const react_1 = tslib_1.__importStar(require('react'));
const react_2 = require('@testing-library/react');
const CompactControlRibbon_1 = require('../../../components/CompactControlRibbon');
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
  // Default desktop layout
  const desktopLayout = {
    deviceType: 'desktop',
    orientation: 'landscape',
    keypadLayoutMode: 'hidden',
    screenWidth: 1024,
    screenHeight: 768,
    isTouchDevice: false,
    isSmallScreen: false,
    hasSpaceForDualKeypads: true
  };
  // Mobile layout with side-by-side keypad
  const mobileLayoutSideBySide = {
    deviceType: 'mobile',
    orientation: 'portrait',
    keypadLayoutMode: 'side-by-side',
    screenWidth: 375,
    screenHeight: 667,
    isTouchDevice: true,
    isSmallScreen: true,
    hasSpaceForDualKeypads: false
  };
  // Mobile layout with stacked keypad
  const mobileLayoutStacked = {
    deviceType: 'mobile',
    orientation: 'portrait',
    keypadLayoutMode: 'stacked',
    screenWidth: 320,
    screenHeight: 568,
    isTouchDevice: true,
    isSmallScreen: true,
    hasSpaceForDualKeypads: false
  };
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default desktop layout
    mockUseResponsiveLayout.mockReturnValue(desktopLayout);
  });
  test('should render compact control ribbon', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    expect(react_2.screen.getByTestId('compact-control-ribbon')).toBeInTheDocument();
    expect(react_2.screen.getByTestId('status-indicator')).toBeInTheDocument();
    expect(react_2.screen.getByTestId('compact-export-button')).toBeInTheDocument();
    expect(react_2.screen.getByTestId('compact-reset-button')).toBeInTheDocument();
    expect(react_2.screen.getByTestId('compact-undo-button')).toBeInTheDocument();
    expect(react_2.screen.getByTestId('compact-redo-button')).toBeInTheDocument();
  });
  test('should show error count in status indicator when puzzle has errors', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    const statusIndicator = react_2.screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveTextContent('2');
    expect(statusIndicator).toHaveAttribute('title', '2 validation errors');
  });
  test('should show checkmark when puzzle is valid', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
        ...mockProps,
        isValid: true,
        validationErrors: []
      })
    );
    const statusIndicator = react_2.screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveTextContent('✓');
    expect(statusIndicator).toHaveAttribute('title', 'Puzzle is valid');
  });
  test('should show checkmark when puzzle is solved', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
        ...mockProps,
        isSolved: true,
        isValid: true,
        validationErrors: []
      })
    );
    const statusIndicator = react_2.screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveTextContent('✓');
    expect(statusIndicator).toHaveAttribute('title', 'Puzzle solved!');
  });
  test('should handle export button click', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    const exportButton = react_2.screen.getByTestId('compact-export-button');
    react_2.fireEvent.click(exportButton);
    expect(mockProps.onExport).toHaveBeenCalled();
  });
  test('should handle undo button click when enabled', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    const undoButton = react_2.screen.getByTestId('compact-undo-button');
    react_2.fireEvent.click(undoButton);
    expect(mockProps.onUndo).toHaveBeenCalled();
  });
  test('should handle redo button click when enabled', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    const redoButton = react_2.screen.getByTestId('compact-redo-button');
    react_2.fireEvent.click(redoButton);
    expect(mockProps.onRedo).toHaveBeenCalled();
  });
  test('should disable undo button when canUndo is false', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
        ...mockProps,
        canUndo: false
      })
    );
    const undoButton = react_2.screen.getByTestId('compact-undo-button');
    expect(undoButton).toBeDisabled();
  });
  test('should disable redo button when canRedo is false', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
        ...mockProps,
        canRedo: false
      })
    );
    const redoButton = react_2.screen.getByTestId('compact-redo-button');
    expect(redoButton).toBeDisabled();
  });
  test('should handle reset confirmation flow', async () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    // First click should show confirmation
    const resetButton = react_2.screen.getByTestId('compact-reset-button');
    react_2.fireEvent.click(resetButton);
    // Should show confirm and cancel buttons
    await (0, react_2.waitFor)(() => {
      expect(react_2.screen.getByTestId('compact-confirm-reset-button')).toBeInTheDocument();
      expect(react_2.screen.getByTestId('compact-cancel-reset-button')).toBeInTheDocument();
    });
    // Click confirm to actually reset
    const confirmButton = await react_2.screen.findByTestId('compact-confirm-reset-button');
    react_2.fireEvent.click(confirmButton);
    expect(mockProps.onReset).toHaveBeenCalled();
  });
  test('should handle reset cancellation', async () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    // First click to enter confirmation mode
    const resetButton = react_2.screen.getByTestId('compact-reset-button');
    react_2.fireEvent.click(resetButton);
    // Click cancel
    const cancelButton = await react_2.screen.findByTestId('compact-cancel-reset-button');
    react_2.fireEvent.click(cancelButton);
    // Should return to normal reset button
    await (0, react_2.waitFor)(() => {
      expect(react_2.screen.getByTestId('compact-reset-button')).toBeInTheDocument();
      expect(mockProps.onReset).not.toHaveBeenCalled();
    });
  });
  test('should auto-hide reset confirmation after timeout', async () => {
    jest.useFakeTimers();
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
    );
    // Enter confirmation mode
    const resetButton = react_2.screen.getByTestId('compact-reset-button');
    react_2.fireEvent.click(resetButton);
    // Verify confirmation appears
    await react_2.screen.findByTestId('compact-confirm-reset-button');
    // Fast-forward time
    (0, react_1.act)(() => {
      jest.advanceTimersByTime(3000);
    });
    // Verify return to normal state
    await (0, react_2.waitFor)(() => {
      expect(react_2.screen.getByTestId('compact-reset-button')).toBeInTheDocument();
      expect(react_2.screen.queryByTestId('compact-confirm-reset-button')).not.toBeInTheDocument();
    });
    jest.useRealTimers();
  });
  test('should disable reset button when canReset is false', () => {
    (0, react_2.render)(
      react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
        ...mockProps,
        canReset: false
      })
    );
    const resetButton = react_2.screen.getByTestId('compact-reset-button');
    expect(resetButton).toBeDisabled();
  });
  // Mobile Layout Tests
  describe('Mobile Layout', () => {
    test('should render mobile layout with side-by-side keypad mode', () => {
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutSideBySide);
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      const container = react_2.screen.getByTestId('compact-control-ribbon');
      expect(container.className).toContain('gap-2');
      expect(container.className).toContain('p-1.5');
    });
    test('should render mobile layout with stacked keypad mode', () => {
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutStacked);
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      const container = react_2.screen.getByTestId('compact-control-ribbon');
      expect(container.className).toContain('gap-2');
      expect(container.className).toContain('p-1.5');
    });
    test('should use smaller button sizes on mobile', () => {
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutSideBySide);
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      const exportButton = react_2.screen.getByTestId('compact-export-button');
      expect(exportButton.className).toContain('w-8');
      expect(exportButton.className).toContain('h-8');
      expect(exportButton.className).toContain('text-xs');
    });
    test('should use smaller status indicator on mobile', () => {
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutSideBySide);
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      const statusIndicator = react_2.screen.getByTestId('status-indicator');
      expect(statusIndicator.className).toContain('w-8');
      expect(statusIndicator.className).toContain('h-8');
      expect(statusIndicator.className).toContain('text-xs');
    });
    test('should not apply mobile layout when device is mobile but keypad mode is overlay', () => {
      mockUseResponsiveLayout.mockReturnValue({
        ...mobileLayoutSideBySide,
        keypadLayoutMode: 'overlay'
      });
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      const container = react_2.screen.getByTestId('compact-control-ribbon');
      // Should use desktop sizing
      expect(container.className).not.toContain('gap-2');
      expect(container.className).not.toContain('p-1.5');
    });
    test('should not apply mobile layout when device is mobile but keypad mode is hidden', () => {
      mockUseResponsiveLayout.mockReturnValue({
        ...mobileLayoutSideBySide,
        keypadLayoutMode: 'hidden'
      });
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      const container = react_2.screen.getByTestId('compact-control-ribbon');
      // Should use desktop sizing
      expect(container.className).not.toContain('gap-2');
      expect(container.className).not.toContain('p-1.5');
    });
  });
  // Killer Combinations Button Tests
  describe('Killer Combinations Button', () => {
    test('should show combinations button when showCombinations is true', () => {
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          canShowCombinations: true,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      expect(combinationsButton).toBeInTheDocument();
    });
    test('should not show combinations button when showCombinations is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: false
        })
      );
      expect(react_2.screen.queryByTestId('compact-combinations-button')).not.toBeInTheDocument();
    });
    test('should not show combinations button when showCombinations is undefined', () => {
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      expect(react_2.screen.queryByTestId('compact-combinations-button')).not.toBeInTheDocument();
    });
    test('should not show combinations button when onCombinations is not provided', () => {
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true
        })
      );
      expect(react_2.screen.queryByTestId('compact-combinations-button')).not.toBeInTheDocument();
    });
    test('should enable combinations button when canShowCombinations is true', () => {
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          canShowCombinations: true,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      expect(combinationsButton).not.toBeDisabled();
      expect(combinationsButton).toHaveAttribute('title', 'Show cage combinations (Ctrl/Cmd+K)');
      expect(combinationsButton).toHaveAttribute('aria-label', 'Show combinations for selected cage');
    });
    test('should disable combinations button when canShowCombinations is false', () => {
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          canShowCombinations: false,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      expect(combinationsButton).toBeDisabled();
      expect(combinationsButton).toHaveAttribute('title', 'Select cells from a single cage');
      expect(combinationsButton).toHaveAttribute('aria-label', 'No cage selected');
    });
    test('should disable combinations button when canShowCombinations is undefined', () => {
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      expect(combinationsButton).toBeDisabled();
    });
    test('should call onCombinations when combinations button is clicked', () => {
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          canShowCombinations: true,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      react_2.fireEvent.click(combinationsButton);
      expect(onCombinations).toHaveBeenCalled();
    });
    test('should render combinations button with SVG icon', () => {
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          canShowCombinations: true,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      const svg = combinationsButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-5', 'h-5');
    });
    test('should render combinations button with mobile sizing', () => {
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutSideBySide);
      const onCombinations = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          showCombinations: true,
          canShowCombinations: true,
          onCombinations: onCombinations
        })
      );
      const combinationsButton = react_2.screen.getByTestId('compact-combinations-button');
      expect(combinationsButton.className).toContain('w-8');
      expect(combinationsButton.className).toContain('h-8');
      expect(combinationsButton.className).toContain('text-xs');
    });
  });
  // Additional Edge Cases
  describe('Additional Edge Cases', () => {
    test('should apply custom className when provided', () => {
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          className: 'custom-class'
        })
      );
      const container = react_2.screen.getByTestId('compact-control-ribbon');
      expect(container.className).toContain('custom-class');
    });
    test('should handle single validation error message correctly', () => {
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, {
          ...mockProps,
          validationErrors: [{ type: 'duplicate-row', cellId: 'A1', message: 'Duplicate in row' }]
        })
      );
      const statusIndicator = react_2.screen.getByTestId('status-indicator');
      expect(statusIndicator).toHaveTextContent('1');
      expect(statusIndicator).toHaveAttribute('title', '1 validation error');
    });
    test('should maintain functionality when switching from desktop to mobile layout', () => {
      mockUseResponsiveLayout.mockReturnValue(desktopLayout);
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      // Verify desktop sizing
      let exportButton = react_2.screen.getByTestId('compact-export-button');
      expect(exportButton.className).toContain('w-10');
      expect(exportButton.className).toContain('h-10');
      // Switch to mobile
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutSideBySide);
      rerender(react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps }));
      // Verify mobile sizing
      exportButton = react_2.screen.getByTestId('compact-export-button');
      expect(exportButton.className).toContain('w-8');
      expect(exportButton.className).toContain('h-8');
    });
    test('should maintain all button functionality on mobile layout', () => {
      mockUseResponsiveLayout.mockReturnValue(mobileLayoutSideBySide);
      (0, react_2.render)(
        react_1.default.createElement(CompactControlRibbon_1.CompactControlRibbon, { ...mockProps })
      );
      // Test all buttons work on mobile
      react_2.fireEvent.click(react_2.screen.getByTestId('compact-export-button'));
      expect(mockProps.onExport).toHaveBeenCalled();
      react_2.fireEvent.click(react_2.screen.getByTestId('compact-undo-button'));
      expect(mockProps.onUndo).toHaveBeenCalled();
      react_2.fireEvent.click(react_2.screen.getByTestId('compact-redo-button'));
      expect(mockProps.onRedo).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=CompactControlRibbon.test.js.map
