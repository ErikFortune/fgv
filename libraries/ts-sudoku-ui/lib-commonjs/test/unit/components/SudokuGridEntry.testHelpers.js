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
exports.defaultProps =
  exports.invalidPuzzleDescription =
  exports.sudokuXPuzzleDescription =
  exports.simplePuzzleDescription =
  exports.validPuzzleDescription =
  exports.mockMatchMedia =
  exports.createPuzzleDefinition =
    void 0;
exports.customRender = customRender;
exports.advanceByLongPress = advanceByLongPress;
exports.setTouchSupport = setTouchSupport;
exports.setWindowDimensions = setWindowDimensions;
exports.renderWithMobilePortrait = renderWithMobilePortrait;
exports.renderWithDesktop = renderWithDesktop;
const react_1 = require('@testing-library/react');
const puzzleDefinitionHelper_1 = require('../../../utils/puzzleDefinitionHelper');
Object.defineProperty(exports, 'createPuzzleDefinition', {
  enumerable: true,
  get: function () {
    return puzzleDefinitionHelper_1.createPuzzleDefinition;
  }
});
// Custom render function - just use standard render
function customRender(ui, options) {
  return (0, react_1.render)(ui, options);
}
// Helper function to simulate long press delay using fake timers
function advanceByLongPress(ms = 600) {
  (0, react_1.act)(() => {
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
function setTouchSupport(hasTouch) {
  if (hasTouch) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: null
    });
  } else {
    // Must be *absent*, not undefined — the probe is an `in` check, which an
    // `undefined`-valued own property still satisfies.
    delete window.ontouchstart;
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
function setWindowDimensions(width, height, hasTouch = false) {
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
function renderWithMobilePortrait(component, options) {
  setWindowDimensions(375, 667, true);
  return customRender(component, options);
}
// Helper to render with desktop layout (hidden/overlay keypads)
function renderWithDesktop(component, options) {
  setWindowDimensions(1024, 768, false);
  return customRender(component, options);
}
// Mock window.matchMedia for responsive layout tests
const mockMatchMedia = (query) => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
};
exports.mockMatchMedia = mockMatchMedia;
// Test puzzle definitions
exports.validPuzzleDescription = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
  id: 'test-puzzle',
  description: 'Test Puzzle',
  type: 'sudoku',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
});
exports.simplePuzzleDescription = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
  id: 'simple-puzzle',
  description: 'Simple Test Puzzle',
  type: 'sudoku',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: '1' + '.'.repeat(80) // 81 total characters
});
exports.sudokuXPuzzleDescription = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
  id: 'sudoku-x-puzzle',
  description: 'Sudoku-X Test Puzzle',
  type: 'sudoku-x',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: '.'.repeat(81)
});
exports.invalidPuzzleDescription = (0, puzzleDefinitionHelper_1.createPuzzleDefinition)({
  id: 'invalid-puzzle',
  description: 'Invalid Puzzle',
  type: 'sudoku',
  level: 1,
  totalRows: 9,
  totalColumns: 9,
  cells: 'invalid' // Too short
});
exports.defaultProps = {
  initialPuzzleDescription: undefined,
  onStateChange: undefined,
  onValidationErrors: undefined,
  className: undefined
};
//# sourceMappingURL=SudokuGridEntry.testHelpers.js.map
