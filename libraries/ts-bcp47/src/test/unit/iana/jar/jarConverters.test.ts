/*
 * Copyright (c) 2022 Erik Fortune
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

import { Converters } from '@fgv/ts-utils';
import * as Iana from '../../../../packlets/iana';

describe('JAR converters', () => {
  describe('JAR format dated registry converter', () => {
    const entry = Converters.strictObject({
      value: Converters.string
    });
    const converter = Iana.Jar.Converters.datedRegistryFromJarRecords(entry);

    test('succeeds for a well-formed JAR format dated registry', () => {
      const t = [{ 'File-Date': '2023-01-01' }, { value: 'v1' }, { value: 'v2' }];
      expect(converter.convert(t)).toSucceedWith({
        fileDate: '2023-01-01' as Iana.Model.YearMonthDaySpec,
        entries: [{ value: 'v1' }, { value: 'v2' }]
      });
    });

    test('fails for an missing file date', () => {
      const t = [{ value: 'v1' }, { value: 'v2' }];
      expect(converter.convert(t)).toFailWith(/File-Date not found/i);
    });

    test('fails for an invalid file date', () => {
      const t = [{ 'File-Date': 'xyzzy' }, { value: 'v1' }, { value: 'v2' }];
      expect(converter.convert(t)).toFailWith(/invalid year-month-date/i);
    });

    test('fails for an invalid entry', () => {
      const t = [{ 'File-Date': '2023-01-01' }, { value: 'v1' }, { value: ['v1', 'v2'] }];
      expect(converter.convert(t)).toFailWith(/not a string/i);
    });

    test('fails for an non-array', () => {
      const t = {
        fileDate: '2023-01-01',
        entries: ['string', 'string', 'string']
      };
      expect(converter.convert(t)).toFailWith(/cannot convert non-array/i);
    });
  });
});
