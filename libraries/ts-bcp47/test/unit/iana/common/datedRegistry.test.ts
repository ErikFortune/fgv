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

import * as CommonConverters from '../../../../src/iana/common/converters';

import { DatedRegistry, YearMonthDaySpec } from '../../../../src/iana/model';

import { Converters } from '@fgv/ts-utils';
import { nowAsYearMonthDay } from '../../../../src/iana/common/utils';

describe('datedRegistry', () => {
  describe('nowAsYearMonthDay', () => {
    test('gets correct values', () => {
      const now = new Date();
      const ymd = nowAsYearMonthDay();

      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      expect(ymd).toEqual(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    });
  });

  describe('datedRegistry converter', () => {
    const converter = CommonConverters.datedRegistry(Converters.string);
    test('succeeds for a well-formed datedRegistry', () => {
      const t: DatedRegistry<string> = {
        fileDate: CommonConverters.yearMonthDaySpec.convert('2022-01-01').orThrow(),
        entries: ['string', 'string', 'string']
      };
      expect(converter.convert(t)).toSucceedWith(t);
    });

    test('fails for an invalid file date', () => {
      const t: DatedRegistry<unknown> = {
        fileDate: 'bad' as YearMonthDaySpec,
        entries: ['string', 'string', 'string']
      };
      expect(converter.convert(t)).toFailWith(/invalid year-month-date/i);
    });

    test('fails for an invalid entry', () => {
      const t: DatedRegistry<unknown> = {
        fileDate: CommonConverters.yearMonthDaySpec.convert('2022-01-01').orThrow(),
        entries: ['string', {}, 'string']
      };
      expect(converter.convert(t)).toFailWith(/not a string/i);
    });
  });
});
