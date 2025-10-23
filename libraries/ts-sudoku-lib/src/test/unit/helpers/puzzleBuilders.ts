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

import '@fgv/ts-utils-jest';
import {
  Puzzle,
  PuzzleState,
  PuzzleSession,
  PuzzleDefinitionFactory,
  STANDARD_CONFIGS,
  PuzzleType,
  ICage,
  IPuzzleDefinition
} from '../../../index';
import { Puzzles } from '../../../index';

/**
 * Creates a standard test puzzle and state from row strings
 * @param rows - 9 strings representing puzzle rows (use '.' for empty cells)
 * @param puzzleId - Optional puzzle ID (defaults to 'test-puzzle')
 * @returns Puzzle instance and initial state
 */
export function createPuzzleAndState(
  rows: string[],
  puzzleId: string = 'test-puzzle'
): { puzzle: Puzzle; state: PuzzleState } {
  const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
    id: puzzleId,
    description: 'Test puzzle',
    type: 'sudoku' as PuzzleType,
    level: 1,
    cells: rows.join('')
  }).orThrow();

  const puzzle = Puzzles.Any.create(puzzleDefinition).orThrow();
  const session = PuzzleSession.create(puzzle).orThrow();

  return { puzzle, state: session.state };
}

/**
 * Creates a test puzzle with specific dimensions
 * @param dimensions - Puzzle dimensions configuration
 * @param cells - Cell values string
 * @param type - Puzzle type (defaults to 'sudoku')
 * @returns Puzzle instance and initial state
 */
export function createPuzzleWithDimensions(
  dimensions: IPuzzleDefinition,
  cells: string,
  type: PuzzleType = 'sudoku' as PuzzleType
): { puzzle: Puzzle; state: PuzzleState } {
  const puzzleDefinition = PuzzleDefinitionFactory.create(dimensions, {
    id: 'test-puzzle',
    description: 'Test puzzle',
    type,
    level: 1,
    cells
  }).orThrow();

  const puzzle = Puzzles.Any.create(puzzleDefinition).orThrow();
  const session = PuzzleSession.create(puzzle).orThrow();

  return { puzzle, state: session.state };
}

/**
 * Configuration for creating test killer sudoku puzzles
 */
export interface ITestKillerPuzzleConfig {
  cells?: string;
  cages?: Array<{
    id?: string;
    cells: string[];
    sum: number;
  }>;
}

/**
 * Creates a killer sudoku puzzle for testing cage-based logic
 * @param config - Configuration for the killer puzzle
 * @returns Puzzle instance, session, and first cage
 */
export function createTestKillerPuzzle(config: ITestKillerPuzzleConfig): {
  puzzle: Puzzle;
  session: PuzzleSession;
  cage?: ICage;
} {
  const cells = config.cells ?? '.'.repeat(81);

  // Build cage specifications
  let cageSpecs = '';
  if (config.cages) {
    cageSpecs = config.cages
      .map((cage) => {
        const id = cage.id ?? `cage${cage.sum}`;
        const cellList = cage.cells.join(',');
        return `${id}:${cellList}:${cage.sum}`;
      })
      .join('|');
  }

  const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
    id: 'test-killer',
    description: 'Test Killer Sudoku',
    type: 'killer' as PuzzleType,
    level: 1,
    cells: cells + (cageSpecs ? `:${cageSpecs}` : '')
  }).orThrow();

  const puzzle = Puzzles.Killer.create(puzzleDefinition).orThrow();
  const session = PuzzleSession.create(puzzle).orThrow();

  // Return first cage if any were defined
  const cage =
    config.cages && config.cages.length > 0
      ? puzzle.cages.find((c) => c.id === (config.cages![0].id ?? `cage${config.cages![0].sum}`))
      : undefined;

  return { puzzle, session, cage };
}

/**
 * Creates a simple killer sudoku cage for testing
 * @param cageSize - Number of cells in the cage
 * @param total - Sum total for the cage
 * @param startCell - Starting cell ID (defaults to 'A1')
 * @returns Cage specification object
 */
export function createSimpleKillerCage(
  cageSize: number,
  total: number,
  startCell: string = 'A1'
): { id: string; cells: string[]; sum: number } {
  const cells: string[] = [startCell];

  // Add adjacent cells horizontally
  const startRow = startCell.charCodeAt(0);
  const startCol = parseInt(startCell.substring(1), 10);

  for (let i = 1; i < cageSize && cells.length < cageSize; i++) {
    const row = String.fromCharCode(startRow);
    const col = startCol + i;
    if (col <= 9) {
      cells.push(`${row}${col}`);
    }
  }

  // If we need more cells, add them vertically
  for (let i = 1; cells.length < cageSize && i < 9; i++) {
    const row = String.fromCharCode(startRow + i);
    const col = startCol;
    if (row <= 'I') {
      cells.push(`${row}${col}`);
    }
  }

  return {
    id: `cage${total}`,
    cells,
    sum: total
  };
}

/**
 * Creates a sudoku X puzzle for testing diagonal constraints
 * @param rows - 9 strings representing puzzle rows
 * @returns Puzzle instance and initial state
 */
export function createSudokuXPuzzle(rows: string[]): { puzzle: Puzzle; state: PuzzleState } {
  const puzzleDefinition = PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
    id: 'test-sudoku-x',
    description: 'Test Sudoku X',
    type: 'sudoku-x' as PuzzleType,
    level: 1,
    cells: rows.join('')
  }).orThrow();

  const puzzle = Puzzles.SudokuX.create(puzzleDefinition).orThrow();
  const session = PuzzleSession.create(puzzle).orThrow();

  return { puzzle, state: session.state };
}
