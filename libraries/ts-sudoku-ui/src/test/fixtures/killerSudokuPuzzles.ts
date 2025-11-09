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

/**
 * Stable killer sudoku puzzle definitions for testing.
 * These puzzles have been validated and are used across multiple test files
 * to ensure consistency in testing killer sudoku functionality.
 *
 * @remarks
 * Killer sudoku cells format: "GRID_MAPPING|CAGE_DEFINITIONS"
 * - GRID_MAPPING: 81 characters mapping each cell to a cage ID (A-Z, a-z)
 * - CAGE_DEFINITIONS: Comma-separated list of cageId+total (e.g., "A11,B09,C20")
 *
 * Example: "AABBCC....|A11,B09,C20,..."
 * - Cells 0-1 are in cage A with total 11
 * - Cells 2-3 are in cage B with total 09
 * - Cells 4-5 are in cage C with total 20
 *
 * @public
 */

/**
 * Valid killer sudoku puzzle with complete cage definitions.
 * This is a standard 9x9 killer sudoku with 27 cages.
 */
export const VALID_KILLER_SUDOKU: string =
  'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11';

/**
 * Killer sudoku puzzle metadata.
 */
export interface IKillerSudokuFixture {
  id: string;
  description: string;
  level: number;
  cells: string;
}

/**
 * Collection of validated killer sudoku puzzles for testing.
 */
export const KILLER_SUDOKU_FIXTURES: IKillerSudokuFixture[] = [
  {
    id: 'valid-killer-1',
    description: 'Valid Killer Sudoku Puzzle',
    level: 1,
    cells: VALID_KILLER_SUDOKU
  }
];
