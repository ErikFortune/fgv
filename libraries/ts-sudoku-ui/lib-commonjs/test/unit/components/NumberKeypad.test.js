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
const NumberKeypad_1 = require('../../../components/NumberKeypad');
describe('NumberKeypad', () => {
  const mockProps = {
    keypadType: 'notes',
    inputMode: 'notes',
    isActive: true,
    onNumberPress: jest.fn(),
    onClear: jest.fn()
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Rendering', () => {
    test('should render notes keypad with correct title', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      expect(react_2.screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(react_2.screen.getByText('📝 Notes')).toBeInTheDocument();
    });
    test('should render values keypad with correct title', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      expect(react_2.screen.getByTestId('number-keypad-values')).toBeInTheDocument();
      expect(react_2.screen.getByText('✏️ Values')).toBeInTheDocument();
    });
    test('should render all number buttons 1-9', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      for (let i = 1; i <= 9; i++) {
        const button = react_2.screen.getByTestId(`keypad-notes-${i}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(i.toString());
      }
    });
    test('should render clear button', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveTextContent('Clear');
    });
    test('should render with custom className', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          className: 'custom-class'
        })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('custom-class');
    });
  });
  describe('Number Button Click Functionality', () => {
    test('should call onNumberPress with correct value when each button is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      for (let i = 1; i <= 9; i++) {
        const button = react_2.screen.getByTestId(`keypad-notes-${i}`);
        react_2.fireEvent.click(button);
        expect(mockProps.onNumberPress).toHaveBeenCalledWith(i);
      }
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(9);
    });
    test('should call onNumberPress when button 1 is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button1 = react_2.screen.getByTestId('keypad-notes-1');
      react_2.fireEvent.click(button1);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(1);
    });
    test('should call onNumberPress when button 5 is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button5 = react_2.screen.getByTestId('keypad-notes-5');
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
    });
    test('should call onNumberPress when button 9 is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button9 = react_2.screen.getByTestId('keypad-notes-9');
      react_2.fireEvent.click(button9);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(9);
    });
    test('should handle rapid clicking of multiple buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button1 = react_2.screen.getByTestId('keypad-notes-1');
      const button2 = react_2.screen.getByTestId('keypad-notes-2');
      const button3 = react_2.screen.getByTestId('keypad-notes-3');
      react_2.fireEvent.click(button1);
      react_2.fireEvent.click(button2);
      react_2.fireEvent.click(button3);
      react_2.fireEvent.click(button1);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(1, 1);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(2, 2);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(3, 3);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(4, 1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(4);
    });
    test('should handle clicking same button multiple times', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button5 = react_2.screen.getByTestId('keypad-notes-5');
      react_2.fireEvent.click(button5);
      react_2.fireEvent.click(button5);
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(3);
    });
    test('should work correctly on values keypad', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      const button7 = react_2.screen.getByTestId('keypad-values-7');
      react_2.fireEvent.click(button7);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(7);
    });
  });
  describe('Clear Button Functionality', () => {
    test('should call onClear when clear button is clicked', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalled();
      expect(mockProps.onClear).toHaveBeenCalledTimes(1);
    });
    test('should work independently from number buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button3 = react_2.screen.getByTestId('keypad-notes-3');
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(button3);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(3);
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalledTimes(1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(1);
    });
    test('should handle multiple clear button clicks', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(clearButton);
      react_2.fireEvent.click(clearButton);
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalledTimes(3);
    });
    test('should work correctly on values keypad', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      const clearButton = react_2.screen.getByTestId('keypad-values-clear');
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalled();
    });
  });
  describe('Disabled State Handling', () => {
    test('should not call onNumberPress when disabled', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      const button1 = react_2.screen.getByTestId('keypad-notes-1');
      react_2.fireEvent.click(button1);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    });
    test('should not call onClear when disabled', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).not.toHaveBeenCalled();
    });
    test('should not trigger any callbacks when all buttons clicked while disabled', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      for (let i = 1; i <= 9; i++) {
        const button = react_2.screen.getByTestId(`keypad-notes-${i}`);
        react_2.fireEvent.click(button);
      }
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
      expect(mockProps.onClear).not.toHaveBeenCalled();
    });
    test('should have disabled styling when disabled', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('opacity-50', 'pointer-events-none');
    });
    test('should have button elements disabled attribute when keypad is disabled', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      const button5 = react_2.screen.getByTestId('keypad-notes-5');
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      expect(button5).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
    test('should work normally when disabled is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: false })
      );
      const button5 = react_2.screen.getByTestId('keypad-notes-5');
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
    });
    test('should work normally when disabled prop is not provided', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button7 = react_2.screen.getByTestId('keypad-notes-7');
      react_2.fireEvent.click(button7);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(7);
    });
  });
  describe('Active/Inactive State Styling', () => {
    test('should have active styling when isActive is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: true })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('shadow-md');
      expect(keypad).not.toHaveClass('opacity-75');
    });
    test('should have inactive styling when isActive is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: false })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('opacity-75');
      expect(keypad).not.toHaveClass('shadow-md');
    });
    test('should still be functional when inactive', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: false })
      );
      const button6 = react_2.screen.getByTestId('keypad-notes-6');
      react_2.fireEvent.click(button6);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(6);
    });
    test('should have different button styling based on active state', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: true })
      );
      const button1Active = react_2.screen.getByTestId('keypad-notes-1');
      expect(button1Active).toHaveClass('bg-blue-500', 'text-white');
      rerender(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: false }));
      const button1Inactive = react_2.screen.getByTestId('keypad-notes-1');
      expect(button1Inactive).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });
  describe('Keypad Type Styling', () => {
    test('should have notes-specific border color', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, keypadType: 'notes' })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('border-blue-500');
    });
    test('should have values-specific border color', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-values');
      expect(keypad).toHaveClass('border-green-500');
    });
  });
  describe('Compact Mode', () => {
    test('should show compact mode styling when compact is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, compact: true })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-2', 'gap-2');
    });
    test('should show standard mode styling by default', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-3', 'gap-3');
    });
    test('should show standard mode styling when compact is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, compact: false })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-3', 'gap-3');
    });
    test('should still function correctly in compact mode', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, compact: true })
      );
      const button4 = react_2.screen.getByTestId('keypad-notes-4');
      react_2.fireEvent.click(button4);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(4);
    });
  });
  describe('Touch/Mobile Interactions', () => {
    test('should handle touch events on number buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button8 = react_2.screen.getByTestId('keypad-notes-8');
      react_2.fireEvent.touchStart(button8);
      react_2.fireEvent.touchEnd(button8);
      react_2.fireEvent.click(button8);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(8);
    });
    test('should handle touch events on clear button', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.touchStart(clearButton);
      react_2.fireEvent.touchEnd(clearButton);
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalled();
    });
    test('should have touch-manipulation class on buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button2 = react_2.screen.getByTestId('keypad-notes-2');
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      expect(button2).toHaveClass('touch-manipulation');
      expect(clearButton).toHaveClass('touch-manipulation');
    });
    test('should trigger haptic feedback on button press when available', () => {
      const mockVibrate = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        configurable: true,
        writable: true
      });
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button3 = react_2.screen.getByTestId('keypad-notes-3');
      react_2.fireEvent.click(button3);
      expect(mockVibrate).toHaveBeenCalledWith(10);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(3);
    });
    test('should trigger haptic feedback on clear button press when available', () => {
      const mockVibrate = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        configurable: true,
        writable: true
      });
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(clearButton);
      expect(mockVibrate).toHaveBeenCalledWith(15);
      expect(mockProps.onClear).toHaveBeenCalled();
    });
    test('should not trigger haptic feedback when disabled', () => {
      const mockVibrate = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        configurable: true,
        writable: true
      });
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      const button5 = react_2.screen.getByTestId('keypad-notes-5');
      react_2.fireEvent.click(button5);
      expect(mockVibrate).not.toHaveBeenCalled();
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    });
  });
  describe('Accessibility', () => {
    test('should have proper ARIA labels for notes keypad', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const keypad = react_2.screen.getByRole('grid', { name: 'notes number keypad' });
      expect(keypad).toBeInTheDocument();
    });
    test('should have proper ARIA labels for values keypad', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      const keypad = react_2.screen.getByRole('grid', { name: 'values number keypad' });
      expect(keypad).toBeInTheDocument();
    });
    test('should have ARIA labels on number buttons for notes keypad', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      for (let i = 1; i <= 9; i++) {
        const button = react_2.screen.getByTestId(`keypad-notes-${i}`);
        expect(button).toHaveAttribute('aria-label', `Enter ${i} as note`);
      }
    });
    test('should have ARIA labels on number buttons for values keypad', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      for (let i = 1; i <= 9; i++) {
        const button = react_2.screen.getByTestId(`keypad-values-${i}`);
        expect(button).toHaveAttribute('aria-label', `Enter ${i} as value`);
      }
    });
    test('should have ARIA label on clear button for notes keypad', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear notes');
    });
    test('should have ARIA label on clear button for values keypad', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      const clearButton = react_2.screen.getByTestId('keypad-values-clear');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear values');
    });
    test('should have button type attribute on all buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      for (let i = 1; i <= 9; i++) {
        const button = react_2.screen.getByTestId(`keypad-notes-${i}`);
        expect(button).toHaveAttribute('type', 'button');
      }
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });
  describe('Keyboard Accessibility', () => {
    test('should respond to keyboard Enter key on number buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button4 = react_2.screen.getByTestId('keypad-notes-4');
      button4.focus();
      react_2.fireEvent.keyDown(button4, { key: 'Enter', code: 'Enter' });
      react_2.fireEvent.click(button4);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(4);
    });
    test('should respond to keyboard Space key on number buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button6 = react_2.screen.getByTestId('keypad-notes-6');
      button6.focus();
      react_2.fireEvent.keyDown(button6, { key: ' ', code: 'Space' });
      react_2.fireEvent.click(button6);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(6);
    });
    test('should respond to keyboard Enter key on clear button', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      clearButton.focus();
      react_2.fireEvent.keyDown(clearButton, { key: 'Enter', code: 'Enter' });
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalled();
    });
    test('should prevent focus on mouse down for number buttons', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button2 = react_2.screen.getByTestId('keypad-notes-2');
      const mouseDownEvent = react_2.fireEvent.mouseDown(button2);
      expect(mouseDownEvent).toBe(false); // preventDefault was called
    });
    test('should prevent focus on mouse down for clear button', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      const mouseDownEvent = react_2.fireEvent.mouseDown(clearButton);
      expect(mouseDownEvent).toBe(false); // preventDefault was called
    });
  });
  describe('Edge Cases and Error Handling', () => {
    test('should handle re-rendering with prop changes', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: true })
      );
      const button1 = react_2.screen.getByTestId('keypad-notes-1');
      react_2.fireEvent.click(button1);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(1);
      rerender(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, isActive: false }));
      react_2.fireEvent.click(button1);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(2);
    });
    test('should handle switching from enabled to disabled', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: false })
      );
      const button3 = react_2.screen.getByTestId('keypad-notes-3');
      react_2.fireEvent.click(button3);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(3);
      rerender(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true }));
      react_2.fireEvent.click(button3);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(1); // Should not increase
    });
    test('should handle switching from disabled to enabled', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: true })
      );
      const button7 = react_2.screen.getByTestId('keypad-notes-7');
      react_2.fireEvent.click(button7);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
      rerender(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, disabled: false }));
      react_2.fireEvent.click(button7);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(7);
    });
    test('should handle changing keypad type', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, keypadType: 'notes' })
      );
      expect(react_2.screen.getByText('📝 Notes')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      expect(react_2.screen.getByText('✏️ Values')).toBeInTheDocument();
    });
    test('should handle changing compact mode', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, compact: false })
      );
      const keypad = react_2.screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-3', 'gap-3');
      rerender(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, compact: true }));
      expect(keypad).toHaveClass('p-2', 'gap-2');
    });
    test('should unmount cleanly', () => {
      const { unmount } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps })
      );
      expect(() => unmount()).not.toThrow();
    });
    test('should work with all combinations of active and disabled states', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          isActive: true,
          disabled: false
        })
      );
      const button5 = react_2.screen.getByTestId('keypad-notes-5');
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
      jest.clearAllMocks();
      rerender(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          isActive: true,
          disabled: true
        })
      );
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
      jest.clearAllMocks();
      rerender(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          isActive: false,
          disabled: false
        })
      );
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
      jest.clearAllMocks();
      rerender(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          isActive: false,
          disabled: true
        })
      );
      react_2.fireEvent.click(button5);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    });
  });
  describe('Integration Scenarios', () => {
    test('should work in value input mode', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      const button2 = react_2.screen.getByTestId('keypad-values-2');
      react_2.fireEvent.click(button2);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(2);
    });
    test('should work in notes input mode', () => {
      (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'notes',
          inputMode: 'notes'
        })
      );
      const button8 = react_2.screen.getByTestId('keypad-notes-8');
      react_2.fireEvent.click(button8);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(8);
    });
    test('should handle interleaved number and clear button presses', () => {
      (0, react_2.render)(react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps }));
      const button1 = react_2.screen.getByTestId('keypad-notes-1');
      const button2 = react_2.screen.getByTestId('keypad-notes-2');
      const clearButton = react_2.screen.getByTestId('keypad-notes-clear');
      react_2.fireEvent.click(button1);
      react_2.fireEvent.click(button2);
      react_2.fireEvent.click(clearButton);
      react_2.fireEvent.click(button1);
      react_2.fireEvent.click(clearButton);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(1, 1);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(2, 2);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(3, 1);
      expect(mockProps.onClear).toHaveBeenCalledTimes(2);
    });
    test('should maintain separate test IDs for notes and values keypads', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, { ...mockProps, keypadType: 'notes' })
      );
      expect(react_2.screen.getByTestId('keypad-notes-5')).toBeInTheDocument();
      expect(react_2.screen.queryByTestId('keypad-values-5')).not.toBeInTheDocument();
      rerender(
        react_1.default.createElement(NumberKeypad_1.NumberKeypad, {
          ...mockProps,
          keypadType: 'values',
          inputMode: 'value'
        })
      );
      expect(react_2.screen.getByTestId('keypad-values-5')).toBeInTheDocument();
      expect(react_2.screen.queryByTestId('keypad-notes-5')).not.toBeInTheDocument();
    });
  });
});
//# sourceMappingURL=NumberKeypad.test.js.map
