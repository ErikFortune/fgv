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

import { CellId, ICellContents, NavigationDirection, IPuzzleDescription } from '@fgv/ts-sudoku-lib';

/**
 * Validation error for display in the UI
 * @public
 */
export interface IValidationError {
  readonly cellId: CellId;
  readonly type:
    | 'duplicate-row'
    | 'duplicate-column'
    | 'duplicate-section'
    | 'duplicate-diagonal'
    | 'invalid-value';
  readonly conflictingCells: CellId[];
  readonly message: string;
}

/**
 * Props for the main SudokuGridEntry component
 * @public
 */
export interface ISudokuGridEntryProps {
  /**
   * Optional initial puzzle session to load. If not provided, an empty puzzle is created.
   */
  readonly initialPuzzleDescription?: IPuzzleDescription;

  /**
   * Callback fired when the puzzle state changes
   */
  readonly onStateChange?: (isValid: boolean, isSolved: boolean) => void;

  /**
   * Callback fired when validation errors occur
   */
  readonly onValidationErrors?: (errors: IValidationError[]) => void;

  /**
   * Optional CSS class name for styling
   */
  readonly className?: string;
}

/**
 * Props for the SudokuGrid component
 * @public
 */
export interface ISudokuGridProps {
  readonly numRows: number;
  readonly numColumns: number;
  readonly cells: ICellDisplayInfo[];
  readonly selectedCell: CellId | null;
  readonly selectedCells: CellId[];
  readonly inputMode: InputMode;
  readonly puzzleType?: string;
  readonly onCellSelect: (cellId: CellId, event?: React.MouseEvent) => void;
  readonly onLongPressToggle?: (cellId: CellId, event: React.TouchEvent | React.MouseEvent) => void;
  readonly onCellValueChange: (cellId: CellId, value: number | undefined) => void;
  readonly onNoteToggle: (cellId: CellId, note: number) => void;
  readonly onClearAllNotes: (cellId: CellId) => void;
  readonly onNavigate: (direction: NavigationDirection) => void;
  readonly onDragOver?: (cellId: CellId) => void;
  readonly onDragEnd?: () => void;
  readonly isDragging?: boolean;
  readonly className?: string;
}

/**
 * Display information for a single cell
 * @public
 */
export interface ICellDisplayInfo {
  readonly id: CellId;
  readonly row: number;
  readonly column: number;
  readonly contents: ICellContents;
  readonly isImmutable: boolean;
  readonly hasValidationError: boolean;
}

/**
 * Input mode for cell interactions
 * @public
 */
export type InputMode = 'value' | 'notes';

/**
 * Props for the SudokuCell component
 * @public
 */
export interface ISudokuCellProps {
  readonly cellInfo: ICellDisplayInfo;
  readonly isSelected: boolean;
  readonly inputMode: InputMode;
  readonly onSelect: (event?: React.MouseEvent) => void;
  readonly onLongPressToggle?: (event: React.TouchEvent | React.MouseEvent) => void;
  readonly onValueChange: (value: number | undefined) => void;
  readonly onNoteToggle: (note: number) => void;
  readonly onClearAllNotes: () => void;
  readonly onDragOver?: () => void;
  readonly className?: string;
}

/**
 * Props for the SudokuControls component
 * @public
 */
export interface ISudokuControlsProps {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly canReset: boolean;
  readonly isValid: boolean;
  readonly isSolved: boolean;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onReset: () => void;
  readonly onExport: () => void;
  readonly className?: string;
}

/**
 * Props for the ValidationDisplay component
 * @public
 */
export interface IValidationDisplayProps {
  readonly errors: IValidationError[];
  readonly isValid: boolean;
  readonly isSolved: boolean;
  readonly className?: string;
}
