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

  test('should call onNumberPress when number button is clicked', () => {
    render(<NumberKeypad {...mockProps} />);

    const button5 = screen.getByTestId('keypad-notes-5');
    fireEvent.click(button5);

    expect(mockProps.onNumberPress).toHaveBeenCalledWith(5);
  });

  test('should call onClear when clear button is clicked', () => {
    render(<NumberKeypad {...mockProps} />);

    const clearButton = screen.getByTestId('keypad-notes-clear');
    fireEvent.click(clearButton);

    expect(mockProps.onClear).toHaveBeenCalled();
  });

  test('should not call handlers when disabled', () => {
    render(<NumberKeypad {...mockProps} disabled={true} />);

    const button1 = screen.getByTestId('keypad-notes-1');
    const clearButton = screen.getByTestId('keypad-notes-clear');

    fireEvent.click(button1);
    fireEvent.click(clearButton);

    expect(mockProps.onNumberPress).not.toHaveBeenCalled();
    expect(mockProps.onClear).not.toHaveBeenCalled();
  });

  test('should have active styling when isActive is true', () => {
    render(<NumberKeypad {...mockProps} isActive={true} />);

    const keypad = screen.getByTestId('number-keypad-notes');
    expect(keypad).toHaveClass('shadow-md'); // Active state adds shadow
  });

  test('should have inactive styling when isActive is false', () => {
    render(<NumberKeypad {...mockProps} isActive={false} />);

    const keypad = screen.getByTestId('number-keypad-notes');
    expect(keypad).toHaveClass('opacity-75'); // Inactive state adds opacity
  });

  test('should show compact mode styling', () => {
    render(<NumberKeypad {...mockProps} compact={true} />);

    const keypad = screen.getByTestId('number-keypad-notes');
    expect(keypad).toHaveClass('p-2', 'gap-2'); // Compact mode uses smaller padding and gap
  });

  test('should show standard mode styling by default', () => {
    render(<NumberKeypad {...mockProps} />);

    const keypad = screen.getByTestId('number-keypad-notes');
    expect(keypad).toHaveClass('p-3', 'gap-3'); // Standard mode uses normal padding and gap
  });

  test('should have proper ARIA labels for accessibility', () => {
    render(<NumberKeypad {...mockProps} />);

    const keypad = screen.getByRole('grid', { name: 'notes number keypad' });
    expect(keypad).toBeInTheDocument();

    const button3 = screen.getByTestId('keypad-notes-3');
    expect(button3).toHaveAttribute('aria-label', 'Enter 3 as note');

    const clearButton = screen.getByTestId('keypad-notes-clear');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear notes');
  });

  test('should show status indicator', () => {
    render(<NumberKeypad {...mockProps} isActive={true} />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    render(<NumberKeypad {...mockProps} isActive={false} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
