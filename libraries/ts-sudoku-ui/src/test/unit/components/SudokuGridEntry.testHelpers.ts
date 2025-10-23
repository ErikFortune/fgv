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

import { render, RenderResult, RenderOptions, act } from '@testing-library/react';
import { IPuzzleDefinition } from '@fgv/ts-sudoku-lib';
import { createPuzzleDefinition } from '../../../utils/puzzleDefinitionHelper';

// Re-export for use in test files
export type { IPuzzleDefinition };
export { createPuzzleDefinition };

// Custom render function - just use standard render
export function customRender(ui: React.ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, options);
}

// Helper function to simulate long press delay using fake timers
export function advanceByLongPress(ms: number = 600): void {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

// Helper to set window dimensions for different device types
export function setWindowDimensions(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
}

// Helper to render with mobile portrait layout (side-by-side keypads)
export function renderWithMobilePortrait(
  component: React.ReactElement,
  options?: RenderOptions
): RenderResult {
  setWindowDimensions(375, 667);
  return customRender(component, options);
}

// Helper to render with desktop layout (hidden/overlay keypads)
export function renderWithDesktop(component: React.ReactElement, options?: RenderOptions): RenderResult {
  setWindowDimensions(1024, 768);
  return customRender(component, options);
}

// Mock window.matchMedia for responsive layout tests
export const mockMatchMedia = (query: string): MediaQueryList => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  } as unknown as MediaQueryList;
};

// Test puzzle definitions
export const validPuzzleDescription: IPuzzleDefinition = createPuzzleDefinition({
  id: 'test-puzzle',
  description: 'Test Puzzle',
  type: 'sudoku',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
});

export const simplePuzzleDescription: IPuzzleDefinition = createPuzzleDefinition({
  id: 'simple-puzzle',
  description: 'Simple Test Puzzle',
  type: 'sudoku',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: '1' + '.'.repeat(80) // 81 total characters
});

export const sudokuXPuzzleDescription: IPuzzleDefinition = createPuzzleDefinition({
  id: 'sudoku-x-puzzle',
  description: 'Sudoku-X Test Puzzle',
  type: 'sudoku-x',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: '.'.repeat(81)
});

export const invalidPuzzleDescription: IPuzzleDefinition = createPuzzleDefinition({
  id: 'invalid-puzzle',
  description: 'Invalid Puzzle',
  type: 'sudoku',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: 'invalid' // Too short
});

export const defaultProps: {
  initialPuzzleDescription: undefined;
  onStateChange: undefined;
  onValidationErrors: undefined;
  className: undefined;
} = {
  initialPuzzleDescription: undefined,
  onStateChange: undefined,
  onValidationErrors: undefined,
  className: undefined
};
