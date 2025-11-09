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
import { CageId, CellId, Ids, PuzzleCollections, parseCellId } from '../../..';

describe('Ids class', () => {
  describe('cageId method', () => {
    test.each(['RA', 'C0', 'SA0'])('succeeds for %p', (id) => {
      expect(Ids.cageId(id)).toSucceedWith(id as CageId);
    });

    // Updated to reflect support for larger grids
    // RAA, C01, SAA00 are now valid for larger grids
    test.each(['R0', 'CX', 'S01'])('fails for for %p', (id) => {
      expect(Ids.cageId(id)).toFail();
    });

    // These formats are now valid for larger grids
    test.each(['RAA', 'C01', 'SAA00'])('succeeds for larger grid format %p', (id) => {
      expect(Ids.cageId(id)).toSucceedWith(id as CageId);
    });

    test('retrieves id from ICage', () => {
      const puzzle = PuzzleCollections.default.getPuzzle('hidden-pair').orThrow();
      expect(Ids.cageId(puzzle.cages[0])).toSucceedWith(puzzle.cages[0].id);
    });
  });

  describe('cellId method', () => {
    describe('with strings', () => {
      test.each(['A0', 'B1', 'J9'])('succeeds for %p', (id) => {
        expect(Ids.cellId(id)).toSucceedWith(id as CellId);
      });

      // These should fail as they're not valid cell IDs
      // Note: S01, C01 are now VALID cell IDs (the cage ID conflict check was incorrect)
      test.each(['CC', 'CX', 'SAA00', 'RAA'])('fails for for %p', (id) => {
        expect(Ids.cellId(id)).toFail();
      });

      // Test valid larger grid formats
      test.each(['AA1', 'Z99', 'AB12'])('succeeds for larger grid format %p', (id) => {
        expect(Ids.cellId(id)).toSucceedWith(id as CellId);
      });

      // Test that cell IDs that happen to match cage ID formats are still valid
      // Cell IDs and cage IDs are used in different contexts, so no conflict exists
      test.each(['S01', 'S09', 'C01', 'C09'])('succeeds for cage-format-like cell ID %p', (id) => {
        expect(Ids.cellId(id)).toSucceedWith(id as CellId);
      });
    });

    describe('with RowColumn', () => {
      expect(Ids.cellId({ row: 0, col: 4 })).toSucceedWith('A5' as CellId);
    });

    test('retrieves id from ICell', () => {
      const puzzle = PuzzleCollections.default.getPuzzle('hidden-pair').orThrow();
      expect(Ids.cellId(puzzle.cells[0])).toSucceedWith(puzzle.cells[0].id);
    });
  });

  describe('large grid support', () => {
    test('should handle columns >= 26 (double letters)', () => {
      // Column 26 should use double-letter row format
      expect(Ids.cellId({ row: 26, col: 0 })).toSucceedAndSatisfy((id) => {
        // Row 26 becomes AA
        expect(id).toMatch(/^[A-Z]{2}\d+$/);
        expect(id).toBe('AA1');
      });
    });

    test('should handle large column indices', () => {
      // Column 27 should map to row AB
      expect(Ids.cellId({ row: 27, col: 0 })).toSucceedAndSatisfy((id) => {
        expect(id).toBe('AB1');
      });

      // Column 51 should map to row AZ (26 * 2 - 1)
      expect(Ids.cellId({ row: 51, col: 0 })).toSucceedAndSatisfy((id) => {
        expect(id).toBe('AZ1');
      });
    });

    test('should handle large grid cell IDs with zero-padded columns', () => {
      // For grids with more than 9 columns, use zero-padding
      expect(Ids.cellId({ row: 0, col: 10 })).toSucceedAndSatisfy((id) => {
        expect(id).toBe('A11');
      });

      expect(Ids.cellId({ row: 0, col: 26 })).toSucceedAndSatisfy((id) => {
        expect(id).toMatch(/^A\d+$/);
      });
    });

    test('should handle row indices requiring double letters (AA, AB, etc.)', () => {
      // Row 26 -> AA, Row 27 -> AB, etc.
      expect(Ids.cellId({ row: 26, col: 5 })).toSucceedWith('AA6' as CellId);
      expect(Ids.cellId({ row: 30, col: 1 })).toSucceedWith('AE2' as CellId);
      expect(Ids.cellId({ row: 51, col: 8 })).toSucceedWith('AZ9' as CellId);
    });

    test('should handle large row and column combinations', () => {
      // Row 26, column 10 (zero-padded)
      expect(Ids.cellId({ row: 26, col: 10 })).toSucceedWith('AA11' as CellId);
      // Row 30, column 15
      expect(Ids.cellId({ row: 30, col: 15 })).toSucceedWith('AE16' as CellId);
    });
  });

  describe('parseCellId', () => {
    test('should parse single-letter cell IDs correctly', () => {
      const parsed = parseCellId('A1');
      expect(parsed).toBeDefined();
      expect(parsed?.row).toBe(0);
      expect(parsed?.col).toBe(0);
    });

    test('should parse double-letter cell IDs correctly', () => {
      // AA01 should parse to row 26, col 0
      const parsed1 = parseCellId('AA01');
      expect(parsed1).toBeDefined();
      expect(parsed1?.row).toBe(26);
      expect(parsed1?.col).toBe(0);

      // AB15 should parse to row 27, col 14
      const parsed2 = parseCellId('AB15');
      expect(parsed2).toBeDefined();
      expect(parsed2?.row).toBe(27);
      expect(parsed2?.col).toBe(14);

      // AZ99 should parse to row 51, col 98
      const parsed3 = parseCellId('AZ99');
      expect(parsed3).toBeDefined();
      expect(parsed3?.row).toBe(51);
      expect(parsed3?.col).toBe(98);
    });

    test('should return undefined for invalid cell ID formats', () => {
      expect(parseCellId('INVALID')).toBeUndefined();
      expect(parseCellId('123')).toBeUndefined();
      expect(parseCellId('A')).toBeUndefined();
      expect(parseCellId('1')).toBeUndefined();
      expect(parseCellId('')).toBeUndefined();
    });
  });

  describe('invalid cell ID formats', () => {
    test('should reject completely invalid format', () => {
      expect(Ids.cellId('INVALID')).toFail();
    });

    test('should reject numeric-only format', () => {
      expect(Ids.cellId('123')).toFail();
    });

    test('should reject special characters', () => {
      expect(Ids.cellId('A@1')).toFail();
    });

    test('should reject empty string', () => {
      expect(Ids.cellId('')).toFail();
    });
  });
});
