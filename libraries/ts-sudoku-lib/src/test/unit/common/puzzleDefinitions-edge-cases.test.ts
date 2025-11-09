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
import { PuzzleDefinitionFactory, PuzzleType, STANDARD_CONFIGS } from '../../../packlets/common';

describe('PuzzleDefinitionFactory - Edge Cases', () => {
  describe('Dimension validation edge cases', () => {
    test('should reject board with cage dimensions below 2x2 minimum', () => {
      const invalidDimensions = {
        ...STANDARD_CONFIGS.puzzle9x9,
        cageWidthInCells: 2,
        cageHeightInCells: 1 // Below 2x2 minimum
      };

      expect(
        PuzzleDefinitionFactory.create(invalidDimensions, {
          id: 'invalid',
          description: 'Invalid cage dimensions',
          type: 'sudoku' as PuzzleType,
          level: 1,
          cells: '.'.repeat(81)
        })
      ).toFailWith(/cage dimensions/i);
    });

    test('should reject board with cage width of 1', () => {
      const invalidDimensions = {
        ...STANDARD_CONFIGS.puzzle9x9,
        cageWidthInCells: 1,
        cageHeightInCells: 2
      };

      expect(
        PuzzleDefinitionFactory.create(invalidDimensions, {
          id: 'invalid',
          description: 'Invalid cage width',
          type: 'sudoku' as PuzzleType,
          level: 1,
          cells: '.'.repeat(81)
        })
      ).toFailWith(/cage dimensions/i);
    });

    test('should reject board dimensions less than 1', () => {
      const invalidDimensions = {
        ...STANDARD_CONFIGS.puzzle9x9,
        boardWidthInCages: 0,
        boardHeightInCages: 3
      };

      expect(
        PuzzleDefinitionFactory.create(invalidDimensions, {
          id: 'invalid',
          description: 'Invalid board dimensions',
          type: 'sudoku' as PuzzleType,
          level: 1,
          cells: '.'.repeat(81)
        })
      ).toFailWith(/board dimensions/i);
    });

    test('should reject negative board dimensions', () => {
      const invalidDimensions = {
        ...STANDARD_CONFIGS.puzzle9x9,
        boardWidthInCages: 3,
        boardHeightInCages: -1
      };

      expect(
        PuzzleDefinitionFactory.create(invalidDimensions, {
          id: 'invalid',
          description: 'Negative board dimension',
          type: 'sudoku' as PuzzleType,
          level: 1,
          cells: '.'.repeat(81)
        })
      ).toFailWith(/board dimensions/i);
    });

    test('should reject cage size that results in values outside 2-25 range', () => {
      const tooLargeDimensions = {
        cageWidthInCells: 6,
        cageHeightInCells: 5, // 6x5 = 30, which is > 25
        boardWidthInCages: 1,
        boardHeightInCages: 1
      };

      expect(
        PuzzleDefinitionFactory.create(tooLargeDimensions, {
          id: 'too-large',
          description: 'Values too large',
          type: 'sudoku' as PuzzleType,
          level: 1,
          cells: '.'.repeat(30)
        })
      ).toFailWith(/Cage size must result in values between 2 and 25/);

      const tooSmallDimensions = {
        cageWidthInCells: 1,
        cageHeightInCells: 1, // 1x1 = 1, which is < 2
        boardWidthInCages: 5,
        boardHeightInCages: 5
      };

      expect(
        PuzzleDefinitionFactory.create(tooSmallDimensions, {
          id: 'too-small',
          description: 'Values too small',
          type: 'sudoku' as PuzzleType,
          level: 1,
          cells: '.'.repeat(25)
        })
      ).toFailWith(/Cage dimensions must be at least 2x2/);
    });
  });
});
