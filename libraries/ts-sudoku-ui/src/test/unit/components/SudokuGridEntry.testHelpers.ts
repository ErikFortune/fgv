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

/**
 * Pins whether the environment looks like a touch device, which
 * `useResponsiveLayout`'s `detectTouchSupport` probes via `'ontouchstart' in window`.
 *
 * This has to be explicit. jsdom 20 did not define `ontouchstart` on `window`, so the
 * probe was incidentally `false` and every test rendered as a non-touch device without
 * saying so. jsdom 26 (Jest 30) **does** define it, which flipped every test to the touch
 * layout — `DualKeypad` then renders its own "N cells selected" status beside
 * `SudokuGridEntry`'s multi-select hint, and twelve `getByText` queries started finding two
 * matches. The viewport was always pinned by `setWindowDimensions`; touch capability was
 * the half of the device profile the tests left to the environment.
 */
export function setTouchSupport(hasTouch: boolean): void {
  if (hasTouch) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: null
    });
  } else {
    // Must be *absent*, not undefined — the probe is an `in` check, which an
    // `undefined`-valued own property still satisfies.
    delete (window as Partial<Window>).ontouchstart;
  }
}

/**
 * Sets the window dimensions, and with them the other half of the device profile:
 * touch capability, which defaults to `false`.
 *
 * The default is deliberate rather than incidental. Under jsdom 20 every test ran as a
 * non-touch device because `ontouchstart` simply did not exist, and the expectations
 * throughout this suite were written against that. Defaulting to `false` keeps those
 * expectations meaning what their authors intended, and makes a touch test say so.
 */
export function setWindowDimensions(width: number, height: number, hasTouch: boolean = false): void {
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
  setTouchSupport(hasTouch);
}

// Helper to render with mobile portrait layout (side-by-side keypads)
export function renderWithMobilePortrait(
  component: React.ReactElement,
  options?: RenderOptions
): RenderResult {
  setWindowDimensions(375, 667, true);
  return customRender(component, options);
}

// Helper to render with desktop layout (hidden/overlay keypads)
export function renderWithDesktop(component: React.ReactElement, options?: RenderOptions): RenderResult {
  setWindowDimensions(1024, 768, false);
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
