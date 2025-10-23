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
import { PuzzleDefinitionFactory, STANDARD_CONFIGS, PuzzleType } from '../../../packlets/common';
import * as Puzzles from '../../../packlets/puzzles';
import { Result } from '@fgv/ts-utils';
import { Puzzle } from '../../../packlets/common';

// Helper function to create killer sudoku puzzle
function createKillerPuzzle(id: string, description: string, level: number, cells: string): Result<Puzzle> {
  return PuzzleDefinitionFactory.create(STANDARD_CONFIGS.puzzle9x9, {
    id,
    description,
    type: 'killer-sudoku' as PuzzleType,
    level,
    cells
  }).onSuccess((puzzleDefinition) => Puzzles.Killer.create(puzzleDefinition));
}

describe('KillerSudokuPuzzle validation - HIGH priority coverage gaps', () => {
  // Valid killer sudoku example for reference
  const validKillerCells =
    'ABCCCDDDEABFFGGGDEHIJKGGLLLHIJKMGLNNHOPPMQQNROOSTMUVWRSSSTTUVWRXYTTTZZabXYYYcccab|A11,B09,C09,D20,E16,F17,G30,H17,I13,J09,K11,L16,M16,N11,O16,P07,Q11,R10,S14,T39,U08,V17,W16,X06,Y26,Z06,a09,b09,c11';

  describe('successful puzzle creation', () => {
    test('should create valid killer sudoku puzzle', () => {
      expect(
        createKillerPuzzle('valid-killer', 'Valid Killer Sudoku', 1, validKillerCells)
      ).toSucceedAndSatisfy((puzzle) => {
        expect(puzzle.type).toBe('killer-sudoku');
        expect(puzzle.id).toBe('valid-killer');
        expect(puzzle.description).toBe('Valid Killer Sudoku');
      });
    });
  });

  describe('TARGET: lines 60-61 - malformed cells|cages validation', () => {
    test('should fail when cells string has multiple pipe separators', () => {
      // Multiple '|' separators - split will produce 3 parts instead of 2
      // This bypasses early validation because first 81 chars are valid
      const multiplePipes = 'A'.repeat(81) + '|A11|extra';

      expect(createKillerPuzzle('multi-pipe', 'Multi Pipe Test', 1, multiplePipes)).toFailWith(
        /malformed cells\|cages/i
      );
    });
  });

  describe('TARGET: lines 75-78 - wrong cell count validation', () => {
    test('should fail when grid mapping has wrong cell count after split', () => {
      // This test targets the internal _getCageCells validation
      // We need to pass early validation but fail the Array.from(mappingDecl).length check
      // The mappingDecl is decl[0], which is everything before the first |
      // If we have exactly 81 chars before pipe but they don't match dimensions, it should fail

      // However, the early validator already checks this. The internal check at lines 75-78
      // is defensive coding for cases where the validator might not have run.
      // Since this is hard to trigger through the public API, we document it here.

      // For now, we test the early validator path which has the same error:
      const tooFewCells = 'A'.repeat(80) + '|A45';
      expect(createKillerPuzzle('too-few', 'Too Few Test', 1, tooFewCells)).toFailWith(
        /must be exactly 81 characters/i
      );
    });
  });

  describe('TARGET: lines 102-103 - mismatched cage count validation', () => {
    test('should fail when cage definitions are fewer than cage IDs in grid', () => {
      // Grid has cages A, B, C only A, B in definitions
      const fewerCages = 'AABBCC' + 'D'.repeat(75) + '|A11,B11';

      expect(createKillerPuzzle('fewer-cages', 'Fewer Cages Test', 1, fewerCages)).toFailWith(
        /expected 4 cage sizes, found 2/i
      );
    });

    test('should fail when cage definitions are more than cage IDs in grid', () => {
      // Grid has only cage A but definitions for A, B, C
      const moreCages = 'A'.repeat(81) + '|A11,B11,C11';

      expect(createKillerPuzzle('more-cages', 'More Cages Test', 1, moreCages)).toFailWith(
        /expected 1 cage sizes, found 3/i
      );
    });
  });

  describe('TARGET: lines 107-108 - invalid cage format validation', () => {
    test('should fail when cage definition has wrong format - missing digit', () => {
      // Cage definition "A" instead of "A11" - doesn't match /^[A-Za-z][0-9][0-9]$/
      const missingDigits = 'A'.repeat(81) + '|A';

      expect(createKillerPuzzle('missing-digits', 'Missing Digits Test', 1, missingDigits)).toFailWith(
        /malformed cage spec/i
      );
    });

    test('should fail when cage definition has wrong format - one digit', () => {
      // Cage definition "A1" instead of "A11" - doesn't match regex
      const oneDigit = 'A'.repeat(81) + '|A1';

      expect(createKillerPuzzle('one-digit', 'One Digit Test', 1, oneDigit)).toFailWith(
        /malformed cage spec/i
      );
    });

    test('should fail when cage definition has wrong format - three digits', () => {
      // Cage definition "A111" instead of "A11" - doesn't match regex
      const threeDigits = 'A'.repeat(81) + '|A111';

      expect(createKillerPuzzle('three-digits', 'Three Digits Test', 1, threeDigits)).toFailWith(
        /malformed cage spec/i
      );
    });
  });

  describe('TARGET: lines 121-122 - invalid cell count per cage validation', () => {
    test('should fail when cage has too many cells for puzzle dimensions', () => {
      // For 9x9 puzzle with maxValue=9, a cage can have at most 9 cells
      // Create cage A with 10 cells, cage B with 71 cells
      const tenCells = 'A'.repeat(10) + 'B'.repeat(71) + '|A45,B99';

      expect(createKillerPuzzle('ten-cells', 'Ten Cells Cage Test', 1, tenCells)).toFailWith(
        /invalid cell count 10 for cage/i
      );
    });

    test('should fail when cage has way too many cells', () => {
      // For 9x9 puzzle, cage with 11+ cells is invalid
      const elevenCells = 'A'.repeat(11) + 'B'.repeat(70) + '|A55,B99';

      expect(createKillerPuzzle('eleven-cells', 'Eleven Cells Cage Test', 1, elevenCells)).toFailWith(
        /invalid cell count 11 for cage/i
      );
    });

    test('should fail when single large cage exceeds maximum', () => {
      // All 81 cells in one cage - way over the limit
      const allOneCage = 'A'.repeat(81) + '|A45';

      expect(createKillerPuzzle('all-one-cage', 'All One Cage Test', 1, allOneCage)).toFailWith(
        /invalid cell count 81 for cage/i
      );
    });
  });

  describe('TARGET: lines 125-126 - invalid cage total validation', () => {
    test('should fail when cage total is too low for number of cells', () => {
      // For cage with 2 cells, minimum total is 3 (1+2)
      // Using total of 2 should fail
      const tooLow = 'AA' + 'B'.repeat(79) + '|A02,B99';

      expect(createKillerPuzzle('too-low', 'Too Low Total Test', 1, tooLow)).toFailWith(
        /invalid total 2 for cage.*expected 3\.\./i
      );
    });

    test('should fail when cage total is too high for number of cells', () => {
      // For cage with 2 cells, maximum total is 17 (8+9)
      // Using total of 18 should fail
      const tooHigh = 'AA' + 'B'.repeat(79) + '|A18,B99';

      expect(createKillerPuzzle('too-high', 'Too High Total Test', 1, tooHigh)).toFailWith(
        /invalid total 18 for cage.*expected.*17/i
      );
    });

    test('should fail when three-cell cage has impossible low total', () => {
      // For cage with 3 cells, minimum is 6 (1+2+3)
      const impossibleLow = 'AAA' + 'B'.repeat(78) + '|A05,B99';

      expect(createKillerPuzzle('impossible-low-3', 'Impossible Low 3 Test', 1, impossibleLow)).toFailWith(
        /invalid total 5 for cage.*expected 6\.\./i
      );
    });

    test('should fail when three-cell cage has impossible high total', () => {
      // For cage with 3 cells, maximum is 24 (7+8+9)
      const impossibleHigh = 'AAA' + 'B'.repeat(78) + '|A25,B99';

      expect(createKillerPuzzle('impossible-high-3', 'Impossible High 3 Test', 1, impossibleHigh)).toFailWith(
        /invalid total 25 for cage.*expected.*24/i
      );
    });

    test('should fail when cage total is zero', () => {
      // Zero is always invalid
      const zeroTotal = 'AA' + 'B'.repeat(79) + '|A00,B99';

      expect(createKillerPuzzle('zero-total', 'Zero Total Test', 1, zeroTotal)).toFailWith(
        /invalid total 0 for cage.*expected 3\.\./i
      );
    });
  });

  describe('edge cases - valid puzzles', () => {
    test('should accept valid killer sudoku puzzles', () => {
      // The validKillerCells example is a known-good puzzle
      expect(createKillerPuzzle('valid', 'Valid Test', 1, validKillerCells)).toSucceed();
    });
  });

  describe('cage structure verification', () => {
    test('should create cages with correct cell membership', () => {
      // Create a simple 9x9 killer with known cage structure
      // Cage A: top-left 3 cells (A1, A2, A3) with sum 6
      // Cage B: next 3 cells (A4, A5, A6) with sum 15
      // Cage C: remaining 3 cells in first row (A7, A8, A9) with sum 24
      // Cage D: all of second row (B1-B9) with sum 45
      // Remaining cages E-Z and 'a' fill out the rest (27 cages total)
      const simpleCages =
        'AAABBBCCCDDDDDDDDDEEEFFFGGGHHIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXYYZZa|' +
        'A06,B15,C24,D45,E06,F15,G24,H06,I15,J15,K15,L15,M06,N15,O15,P15,Q15,R15,S15,T15,U15,V15,W15,X06,Y06,Z06,a03';

      expect(createKillerPuzzle('cage-structure', 'Cage Structure Test', 1, simpleCages)).toSucceedAndSatisfy(
        (puzzle) => {
          // Verify we have the expected number of killer cages (excluding row/column/section cages)
          // We expect killer cages with IDs starting with 'K'
          const killerCages = puzzle.cages.filter((cage) => cage.id.startsWith('K'));
          expect(killerCages.length).toBeGreaterThan(0);

          // Find and verify specific cages by their properties
          // Cage A should have 3 cells with sum 6
          const cageA = killerCages.find((c) => c.total === 6 && c.numCells === 3);
          expect(cageA).toBeDefined();
          if (cageA) {
            // Explicitly verify containsCell for cage A
            // Cage A should contain A1, A2, A3
            expect(cageA.containsCell('A1' as import('../../../packlets/common').CellId)).toBe(true);
            expect(cageA.containsCell('A2' as import('../../../packlets/common').CellId)).toBe(true);
            expect(cageA.containsCell('A3' as import('../../../packlets/common').CellId)).toBe(true);
            // Should not contain A4
            expect(cageA.containsCell('A4' as import('../../../packlets/common').CellId)).toBe(false);
          }

          // Cage B should have 3 cells with sum 15
          const cageB = killerCages.find(
            (c) =>
              c.total === 15 &&
              c.numCells === 3 &&
              c.cellIds.includes('A4' as import('../../../packlets/common').CellId)
          );
          expect(cageB).toBeDefined();
          if (cageB) {
            // Explicitly verify containsCell for cage B
            expect(cageB.containsCell('A4' as import('../../../packlets/common').CellId)).toBe(true);
            expect(cageB.containsCell('A5' as import('../../../packlets/common').CellId)).toBe(true);
            expect(cageB.containsCell('A6' as import('../../../packlets/common').CellId)).toBe(true);
            // Should not contain A3 or A7
            expect(cageB.containsCell('A3' as import('../../../packlets/common').CellId)).toBe(false);
            expect(cageB.containsCell('A7' as import('../../../packlets/common').CellId)).toBe(false);
          }

          // Cage D should have 9 cells (entire second row) with sum 45
          const cageD = killerCages.find((c) => c.total === 45 && c.numCells === 9);
          expect(cageD).toBeDefined();
          if (cageD) {
            // Explicitly verify containsCell for cage D
            // Should contain all cells B1-B9
            expect(cageD.containsCell('B1' as import('../../../packlets/common').CellId)).toBe(true);
            expect(cageD.containsCell('B5' as import('../../../packlets/common').CellId)).toBe(true);
            expect(cageD.containsCell('B9' as import('../../../packlets/common').CellId)).toBe(true);
            // Should not contain A1 or C1
            expect(cageD.containsCell('A1' as import('../../../packlets/common').CellId)).toBe(false);
            expect(cageD.containsCell('C1' as import('../../../packlets/common').CellId)).toBe(false);
          }
        }
      );
    });
  });
});
