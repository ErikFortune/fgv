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
import { Converters } from '../../../packlets/common';

describe('Converters - Edge Cases', () => {
  describe('cellId converter edge cases', () => {
    test('should accept cell IDs that happen to match cage ID formats', () => {
      // Cell IDs and cage IDs are used in different contexts, so there's no conflict
      // Cell IDs that happen to look like section cage IDs are valid
      expect(Converters.cellId.convert('SA00')).toSucceed(); // Row SA, column 00
      expect(Converters.cellId.convert('SB12')).toSucceed(); // Row SB, column 12
      expect(Converters.cellId.convert('S01')).toSucceed(); // Row S, column 01
      expect(Converters.cellId.convert('S09')).toSucceed(); // Row S, column 09

      // Cell IDs that happen to look like column cage IDs are valid
      expect(Converters.cellId.convert('C01')).toSucceed(); // Row C, column 01
      expect(Converters.cellId.convert('C02')).toSucceed(); // Row C, column 02
      expect(Converters.cellId.convert('C09')).toSucceed(); // Row C, column 09
    });

    test('should accept standard valid cell IDs', () => {
      // Standard valid cell IDs
      expect(Converters.cellId.convert('A1')).toSucceed();
      expect(Converters.cellId.convert('I9')).toSucceed();
      expect(Converters.cellId.convert('C1')).toSucceed();
      expect(Converters.cellId.convert('C10')).toSucceed();
      expect(Converters.cellId.convert('S1')).toSucceed();
    });
  });
});
