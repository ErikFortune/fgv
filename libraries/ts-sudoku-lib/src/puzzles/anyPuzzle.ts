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

import { Result, fail } from '@fgv/ts-utils';

import { Puzzle } from '../common';
import { IPuzzleDescription } from '../file/model';
import { KillerSudokuPuzzle } from './killerSudokuPuzzle';
import { SudokuPuzzle } from './sudokuPuzzle';
import { SudokuXPuzzle } from './sudokuXPuzzle';

/**
 * Static class to instantiate any puzzle from a {@link Data.Model.PuzzleDescription | puzzle description}.
 * @internal
 */
export class AnyPuzzle {
  public static create(puzzle: IPuzzleDescription): Result<Puzzle> {
    switch (puzzle.type) {
      case 'sudoku':
        return SudokuPuzzle.create(puzzle);
      case 'sudoku-x':
        return SudokuXPuzzle.create(puzzle);
      case 'killer-sudoku':
        return KillerSudokuPuzzle.create(puzzle);
      default:
        /* c8 ignore next */
        return fail(`Puzzle '${puzzle.description}' unsupported type ${puzzle.type}`);
    }
  }
}
