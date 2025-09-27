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
    deviceType: 'mobile',
    orientation: 'portrait',
    keypadLayoutMode: 'side-by-side',
    screenWidth: 400,
    screenHeight: 800,
    isTouchDevice: true,
    isSmallScreen: true,
    hasSpaceForDualKeypads: true
  })
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DualKeypad } from '../../../components/DualKeypad';

describe('DualKeypad', () => {
  const mockProps = {
    inputMode: 'notes' as const,
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
  });

  test('should render both keypads in side-by-side mode', () => {
    render(<DualKeypad {...mockProps} />);

    expect(screen.getByTestId('dual-keypad')).toBeInTheDocument();
    expect(screen.getByTestId('number-keypad-notes')).toBeInTheDocument();
    expect(screen.getByTestId('number-keypad-values')).toBeInTheDocument();
  });

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

  test('should show status text for multi-selection', () => {
    render(<DualKeypad {...mockProps} selectedCellCount={3} />);

    expect(screen.getByText('3 cells selected - operations apply to all')).toBeInTheDocument();
  });

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

  test('should handle input mode change', () => {
    render(<DualKeypad {...mockProps} />);

    // Find input mode toggle buttons (they show emoji icons)
    const valueModeButton = screen.getByText('✏️');
    fireEvent.click(valueModeButton);

    expect(mockProps.onInputModeChange).toHaveBeenCalledWith('value');
  });
});
