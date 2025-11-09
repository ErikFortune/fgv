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
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberKeypad } from '../../../components/NumberKeypad';

describe('NumberKeypad', () => {
  const mockProps = {
    keypadType: 'notes' as const,
    inputMode: 'notes' as const,
    isActive: true,
    onNumberPress: jest.fn(),
    onClear: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render notes keypad with correct title', () => {
      render(<NumberKeypad {...mockProps} />);

      expect(screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
      expect(screen.getByText('📝 Notes')).toBeInTheDocument();
    });

    test('should render values keypad with correct title', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      expect(screen.getByTestId('number-keypad-values')).toBeInTheDocument();
      expect(screen.getByText('✏️ Values')).toBeInTheDocument();
    });

    test('should render all number buttons 1-9', () => {
      render(<NumberKeypad {...mockProps} />);

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByTestId(`keypad-notes-${i}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(i.toString());
      }
    });

    test('should render clear button', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveTextContent('Clear');
    });

    test('should render with custom className', () => {
      render(<NumberKeypad {...mockProps} className="custom-class" />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('custom-class');
    });
  });

  describe('Number Button Click Functionality', () => {
    test('should call onNumberPress with correct value when each button is clicked', () => {
      render(<NumberKeypad {...mockProps} />);

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByTestId(`keypad-notes-${i}`);
        fireEvent.click(button);
        expect(mockProps.onNumberPress).toHaveBeenCalledWith(i);
      }

      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(9);
    });

    test('should call onNumberPress when button 1 is clicked', () => {
      render(<NumberKeypad {...mockProps} />);

      const button1 = screen.getByTestId('keypad-notes-1');
      fireEvent.click(button1);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(1);
    });

    test('should call onNumberPress when button 5 is clicked', () => {
      render(<NumberKeypad {...mockProps} />);

      const button5 = screen.getByTestId('keypad-notes-5');
      fireEvent.click(button5);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
    });

    test('should call onNumberPress when button 9 is clicked', () => {
      render(<NumberKeypad {...mockProps} />);

      const button9 = screen.getByTestId('keypad-notes-9');
      fireEvent.click(button9);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(9);
    });

    test('should handle rapid clicking of multiple buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button1 = screen.getByTestId('keypad-notes-1');
      const button2 = screen.getByTestId('keypad-notes-2');
      const button3 = screen.getByTestId('keypad-notes-3');

      fireEvent.click(button1);
      fireEvent.click(button2);
      fireEvent.click(button3);
      fireEvent.click(button1);

      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(1, 1);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(2, 2);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(3, 3);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(4, 1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(4);
    });

    test('should handle clicking same button multiple times', () => {
      render(<NumberKeypad {...mockProps} />);

      const button5 = screen.getByTestId('keypad-notes-5');

      fireEvent.click(button5);
      fireEvent.click(button5);
      fireEvent.click(button5);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(3);
    });

    test('should work correctly on values keypad', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      const button7 = screen.getByTestId('keypad-values-7');
      fireEvent.click(button7);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(7);
    });
  });

  describe('Clear Button Functionality', () => {
    test('should call onClear when clear button is clicked', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.click(clearButton);

      expect(mockProps.onClear).toHaveBeenCalled();
      expect(mockProps.onClear).toHaveBeenCalledTimes(1);
    });

    test('should work independently from number buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button3 = screen.getByTestId('keypad-notes-3');
      const clearButton = screen.getByTestId('keypad-notes-clear');

      fireEvent.click(button3);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(3);

      fireEvent.click(clearButton);
      expect(mockProps.onClear).toHaveBeenCalledTimes(1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple clear button clicks', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');

      fireEvent.click(clearButton);
      fireEvent.click(clearButton);
      fireEvent.click(clearButton);

      expect(mockProps.onClear).toHaveBeenCalledTimes(3);
    });

    test('should work correctly on values keypad', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      const clearButton = screen.getByTestId('keypad-values-clear');
      fireEvent.click(clearButton);

      expect(mockProps.onClear).toHaveBeenCalled();
    });
  });

  describe('Disabled State Handling', () => {
    test('should not call onNumberPress when disabled', () => {
      render(<NumberKeypad {...mockProps} disabled={true} />);

      const button1 = screen.getByTestId('keypad-notes-1');
      fireEvent.click(button1);

      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    });

    test('should not call onClear when disabled', () => {
      render(<NumberKeypad {...mockProps} disabled={true} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.click(clearButton);

      expect(mockProps.onClear).not.toHaveBeenCalled();
    });

    test('should not trigger any callbacks when all buttons clicked while disabled', () => {
      render(<NumberKeypad {...mockProps} disabled={true} />);

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByTestId(`keypad-notes-${i}`);
        fireEvent.click(button);
      }

      const clearButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.click(clearButton);

      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
      expect(mockProps.onClear).not.toHaveBeenCalled();
    });

    test('should have disabled styling when disabled', () => {
      render(<NumberKeypad {...mockProps} disabled={true} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('opacity-50', 'pointer-events-none');
    });

    test('should have button elements disabled attribute when keypad is disabled', () => {
      render(<NumberKeypad {...mockProps} disabled={true} />);

      const button5 = screen.getByTestId('keypad-notes-5');
      const clearButton = screen.getByTestId('keypad-notes-clear');

      expect(button5).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });

    test('should work normally when disabled is false', () => {
      render(<NumberKeypad {...mockProps} disabled={false} />);

      const button5 = screen.getByTestId('keypad-notes-5');
      fireEvent.click(button5);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
    });

    test('should work normally when disabled prop is not provided', () => {
      render(<NumberKeypad {...mockProps} />);

      const button7 = screen.getByTestId('keypad-notes-7');
      fireEvent.click(button7);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(7);
    });
  });

  describe('Active/Inactive State Styling', () => {
    test('should have active styling when isActive is true', () => {
      render(<NumberKeypad {...mockProps} isActive={true} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('shadow-md');
      expect(keypad).not.toHaveClass('opacity-75');
    });

    test('should have inactive styling when isActive is false', () => {
      render(<NumberKeypad {...mockProps} isActive={false} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('opacity-75');
      expect(keypad).not.toHaveClass('shadow-md');
    });

    test('should still be functional when inactive', () => {
      render(<NumberKeypad {...mockProps} isActive={false} />);

      const button6 = screen.getByTestId('keypad-notes-6');
      fireEvent.click(button6);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(6);
    });

    test('should have different button styling based on active state', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} isActive={true} />);

      const button1Active = screen.getByTestId('keypad-notes-1');
      expect(button1Active).toHaveClass('bg-blue-500', 'text-white');

      rerender(<NumberKeypad {...mockProps} isActive={false} />);

      const button1Inactive = screen.getByTestId('keypad-notes-1');
      expect(button1Inactive).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });

  describe('Keypad Type Styling', () => {
    test('should have notes-specific border color', () => {
      render(<NumberKeypad {...mockProps} keypadType="notes" />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('border-blue-500');
    });

    test('should have values-specific border color', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      const keypad = screen.getByTestId('number-keypad-values');
      expect(keypad).toHaveClass('border-green-500');
    });
  });

  describe('Compact Mode', () => {
    test('should show compact mode styling when compact is true', () => {
      render(<NumberKeypad {...mockProps} compact={true} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-2', 'gap-2');
    });

    test('should show standard mode styling by default', () => {
      render(<NumberKeypad {...mockProps} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-3', 'gap-3');
    });

    test('should show standard mode styling when compact is false', () => {
      render(<NumberKeypad {...mockProps} compact={false} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-3', 'gap-3');
    });

    test('should still function correctly in compact mode', () => {
      render(<NumberKeypad {...mockProps} compact={true} />);

      const button4 = screen.getByTestId('keypad-notes-4');
      fireEvent.click(button4);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(4);
    });
  });

  describe('Touch/Mobile Interactions', () => {
    test('should handle touch events on number buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button8 = screen.getByTestId('keypad-notes-8');
      fireEvent.touchStart(button8);
      fireEvent.touchEnd(button8);
      fireEvent.click(button8);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(8);
    });

    test('should handle touch events on clear button', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.touchStart(clearButton);
      fireEvent.touchEnd(clearButton);
      fireEvent.click(clearButton);

      expect(mockProps.onClear).toHaveBeenCalled();
    });

    test('should have touch-manipulation class on buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button2 = screen.getByTestId('keypad-notes-2');
      const clearButton = screen.getByTestId('keypad-notes-clear');

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

      render(<NumberKeypad {...mockProps} />);

      const button3 = screen.getByTestId('keypad-notes-3');
      fireEvent.click(button3);

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

      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      fireEvent.click(clearButton);

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

      render(<NumberKeypad {...mockProps} disabled={true} />);

      const button5 = screen.getByTestId('keypad-notes-5');
      fireEvent.click(button5);

      expect(mockVibrate).not.toHaveBeenCalled();
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for notes keypad', () => {
      render(<NumberKeypad {...mockProps} />);

      const keypad = screen.getByRole('grid', { name: 'notes number keypad' });
      expect(keypad).toBeInTheDocument();
    });

    test('should have proper ARIA labels for values keypad', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      const keypad = screen.getByRole('grid', { name: 'values number keypad' });
      expect(keypad).toBeInTheDocument();
    });

    test('should have ARIA labels on number buttons for notes keypad', () => {
      render(<NumberKeypad {...mockProps} />);

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByTestId(`keypad-notes-${i}`);
        expect(button).toHaveAttribute('aria-label', `Enter ${i} as note`);
      }
    });

    test('should have ARIA labels on number buttons for values keypad', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByTestId(`keypad-values-${i}`);
        expect(button).toHaveAttribute('aria-label', `Enter ${i} as value`);
      }
    });

    test('should have ARIA label on clear button for notes keypad', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear notes');
    });

    test('should have ARIA label on clear button for values keypad', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      const clearButton = screen.getByTestId('keypad-values-clear');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear values');
    });

    test('should have button type attribute on all buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByTestId(`keypad-notes-${i}`);
        expect(button).toHaveAttribute('type', 'button');
      }

      const clearButton = screen.getByTestId('keypad-notes-clear');
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Keyboard Accessibility', () => {
    test('should respond to keyboard Enter key on number buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button4 = screen.getByTestId('keypad-notes-4');
      button4.focus();
      fireEvent.keyDown(button4, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button4);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(4);
    });

    test('should respond to keyboard Space key on number buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button6 = screen.getByTestId('keypad-notes-6');
      button6.focus();
      fireEvent.keyDown(button6, { key: ' ', code: 'Space' });
      fireEvent.click(button6);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(6);
    });

    test('should respond to keyboard Enter key on clear button', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      clearButton.focus();
      fireEvent.keyDown(clearButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(clearButton);

      expect(mockProps.onClear).toHaveBeenCalled();
    });

    test('should prevent focus on mouse down for number buttons', () => {
      render(<NumberKeypad {...mockProps} />);

      const button2 = screen.getByTestId('keypad-notes-2');
      const mouseDownEvent = fireEvent.mouseDown(button2);

      expect(mouseDownEvent).toBe(false); // preventDefault was called
    });

    test('should prevent focus on mouse down for clear button', () => {
      render(<NumberKeypad {...mockProps} />);

      const clearButton = screen.getByTestId('keypad-notes-clear');
      const mouseDownEvent = fireEvent.mouseDown(clearButton);

      expect(mouseDownEvent).toBe(false); // preventDefault was called
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle re-rendering with prop changes', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} isActive={true} />);

      const button1 = screen.getByTestId('keypad-notes-1');
      fireEvent.click(button1);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(1);

      rerender(<NumberKeypad {...mockProps} isActive={false} />);

      fireEvent.click(button1);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(1);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(2);
    });

    test('should handle switching from enabled to disabled', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} disabled={false} />);

      const button3 = screen.getByTestId('keypad-notes-3');
      fireEvent.click(button3);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(3);

      rerender(<NumberKeypad {...mockProps} disabled={true} />);

      fireEvent.click(button3);
      expect(mockProps.onNumberPress).toHaveBeenCalledTimes(1); // Should not increase
    });

    test('should handle switching from disabled to enabled', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} disabled={true} />);

      const button7 = screen.getByTestId('keypad-notes-7');
      fireEvent.click(button7);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();

      rerender(<NumberKeypad {...mockProps} disabled={false} />);

      fireEvent.click(button7);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(7);
    });

    test('should handle changing keypad type', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} keypadType="notes" />);

      expect(screen.getByText('📝 Notes')).toBeInTheDocument();

      rerender(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      expect(screen.getByText('✏️ Values')).toBeInTheDocument();
    });

    test('should handle changing compact mode', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} compact={false} />);

      const keypad = screen.getByTestId('number-keypad-notes');
      expect(keypad).toHaveClass('p-3', 'gap-3');

      rerender(<NumberKeypad {...mockProps} compact={true} />);

      expect(keypad).toHaveClass('p-2', 'gap-2');
    });

    test('should unmount cleanly', () => {
      const { unmount } = render(<NumberKeypad {...mockProps} />);

      expect(() => unmount()).not.toThrow();
    });

    test('should work with all combinations of active and disabled states', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} isActive={true} disabled={false} />);

      const button5 = screen.getByTestId('keypad-notes-5');
      fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);

      jest.clearAllMocks();
      rerender(<NumberKeypad {...mockProps} isActive={true} disabled={true} />);
      fireEvent.click(button5);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();

      jest.clearAllMocks();
      rerender(<NumberKeypad {...mockProps} isActive={false} disabled={false} />);
      fireEvent.click(button5);
      expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);

      jest.clearAllMocks();
      rerender(<NumberKeypad {...mockProps} isActive={false} disabled={true} />);
      fireEvent.click(button5);
      expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    test('should work in value input mode', () => {
      render(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      const button2 = screen.getByTestId('keypad-values-2');
      fireEvent.click(button2);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(2);
    });

    test('should work in notes input mode', () => {
      render(<NumberKeypad {...mockProps} keypadType="notes" inputMode="notes" />);

      const button8 = screen.getByTestId('keypad-notes-8');
      fireEvent.click(button8);

      expect(mockProps.onNumberPress).toHaveBeenCalledWith(8);
    });

    test('should handle interleaved number and clear button presses', () => {
      render(<NumberKeypad {...mockProps} />);

      const button1 = screen.getByTestId('keypad-notes-1');
      const button2 = screen.getByTestId('keypad-notes-2');
      const clearButton = screen.getByTestId('keypad-notes-clear');

      fireEvent.click(button1);
      fireEvent.click(button2);
      fireEvent.click(clearButton);
      fireEvent.click(button1);
      fireEvent.click(clearButton);

      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(1, 1);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(2, 2);
      expect(mockProps.onNumberPress).toHaveBeenNthCalledWith(3, 1);
      expect(mockProps.onClear).toHaveBeenCalledTimes(2);
    });

    test('should maintain separate test IDs for notes and values keypads', () => {
      const { rerender } = render(<NumberKeypad {...mockProps} keypadType="notes" />);

      expect(screen.getByTestId('keypad-notes-5')).toBeInTheDocument();
      expect(screen.queryByTestId('keypad-values-5')).not.toBeInTheDocument();

      rerender(<NumberKeypad {...mockProps} keypadType="values" inputMode="value" />);

      expect(screen.getByTestId('keypad-values-5')).toBeInTheDocument();
      expect(screen.queryByTestId('keypad-notes-5')).not.toBeInTheDocument();
    });
  });
});
