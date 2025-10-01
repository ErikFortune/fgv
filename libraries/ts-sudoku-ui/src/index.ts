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

// Main components
export { SudokuGridEntry } from './components/SudokuGridEntry';
export { SudokuGrid } from './components/SudokuGrid';
export { SudokuCell } from './components/SudokuCell';
export { SudokuControls } from './components/SudokuControls';
export { ValidationDisplay } from './components/ValidationDisplay';
export { CompactControlRibbon } from './components/CompactControlRibbon';
export { DualKeypad } from './components/DualKeypad';
export { NumberKeypad } from './components/NumberKeypad';
export { CageOverlay } from './components/CageOverlay';
export { CageSumIndicator } from './components/CageSumIndicator';

// Contexts
export * from './contexts/DiagnosticLoggerContext';

// Hooks
export { usePuzzleSession } from './hooks/usePuzzleSession';
export { useResponsiveLayout } from './hooks/useResponsiveLayout';

// Types
export type {
  IValidationError,
  ISudokuGridEntryProps,
  ISudokuGridProps,
  ICellDisplayInfo,
  ISudokuCellProps,
  ISudokuControlsProps,
  IValidationDisplayProps,
  ICageDisplayInfo,
  ICageOverlayProps,
  ICageSumIndicatorProps
} from './types';

// Compact control ribbon types
export type { ICompactControlRibbonProps } from './components/CompactControlRibbon';

// Dual keypad types
export type { INumberKeypadProps } from './components/NumberKeypad';
export type { IDualKeypadProps } from './components/DualKeypad';

// Responsive layout types
export type {
  DeviceType,
  ScreenOrientation,
  KeypadLayoutMode,
  IResponsiveLayoutInfo
} from './hooks/useResponsiveLayout';

// Re-export commonly used types from ts-sudoku-lib
export type { IPuzzleDescription } from '@fgv/ts-sudoku-lib';
