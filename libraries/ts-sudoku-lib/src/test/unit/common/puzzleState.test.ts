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
import { CellId, ICellState, PuzzleState } from '../../../packlets/common';

describe('PuzzleState', () => {
  const testCells: ICellState[] = [
    {
      id: 'A1' as CellId,
      value: undefined,
      notes: []
    },
    {
      id: 'A2' as CellId,
      value: 2,
      notes: []
    },
    {
      id: 'A3' as CellId,
      value: undefined,
      notes: [1, 2, 3]
    }
  ];
  let state: PuzzleState;

  beforeEach(() => {
    state = PuzzleState.create(testCells).orThrow();
  });

  describe('getCellContents', () => {
    test('succeeds for a cell that exists', () => {
      expect(state.getCellContents('A1' as CellId)).toSucceedWith({
        value: undefined,
        notes: []
      });
      expect(state.getCellContents('A2' as CellId)).toSucceedWith({
        value: 2,
        notes: []
      });
      expect(state.getCellContents('A3' as CellId)).toSucceedWith({
        value: undefined,
        notes: [1, 2, 3]
      });
    });

    test('fails for a cell that does not exist', () => {
      expect(state.getCellContents('B9' as CellId)).toFailWith(/cell b9 not found/i);
    });
  });

  describe('hasValue', () => {
    test('returns true for a cell with a value', () => {
      expect(state.hasValue('A2' as CellId)).toBe(true);
    });

    test('returns false for a cell with no value', () => {
      expect(state.hasValue('A1' as CellId)).toBe(false);
    });

    test('returns false for an invalid cell', () => {
      expect(state.hasValue('Z9' as CellId)).toBe(false);
    });
  });

  describe('update', () => {
    test('succeeds for valid updates', () => {
      const updates: ICellState[] = [
        {
          id: 'A1' as CellId,
          value: 1,
          notes: [1]
        },
        {
          id: 'A2' as CellId,
          value: 2,
          notes: [2]
        }
      ];
      expect(state.update(updates)).toSucceedAndSatisfy((updated) => {
        expect(updated.getCellContents('A1' as CellId)).toSucceedWith({
          value: 1,
          notes: [1]
        });
        expect(updated.getCellContents('A2' as CellId)).toSucceedWith({
          value: 2,
          notes: [2]
        });
        expect(updated.getCellContents('A3' as CellId)).toSucceedWith({
          value: undefined,
          notes: [1, 2, 3]
        });
      });
    });

    test('fails if an update adds cells', () => {
      const updates: ICellState[] = [
        {
          id: 'B9' as CellId,
          value: 1,
          notes: []
        }
      ];

      expect(state.update(updates)).toFailWith(/update added cells/i);
    });
  });
});
