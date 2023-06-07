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
import * as Converters from '../../../../src/iana/common/converters';
import * as Validate from '../../../../src/iana/common/validate';
import {
  IsoAlpha2RegionCode,
  IsoAlpha3RegionCode,
  UnM49RegionCode,
  YearMonthDaySpec
} from '../../../../src/iana/model';

describe('Iana common validators', () => {
  describe('year-month-day', () => {
    const v = Validate.yearMonthDateSpec;
    const c = Converters.yearMonthDaySpec;
    test.each(['2022-12-06'])('%p is a well-formed and canonical year-month-day', (ymd) => {
      expect(v.isWellFormed(ymd)).toBe(true);
      expect(v.converter.convert(ymd)).toSucceedWith(ymd as YearMonthDaySpec);
      expect(c.convert(ymd)).toSucceedWith(ymd as YearMonthDaySpec);

      expect(v.isCanonical(ymd)).toBe(true);
      expect(v.toCanonical(ymd)).toSucceedWith(ymd as YearMonthDaySpec);
    });

    test.each(['12-12-12'])('%p is not a well-formed or canonical year-month-day', (ymd) => {
      expect(v.isWellFormed(ymd)).toBe(false);
      expect(v.converter.convert(ymd)).toFailWith(/invalid Year-Month-Date/i);
      expect(c.convert(ymd)).toFailWith(/invalid Year-Month-Date/i);

      expect(v.isCanonical(ymd)).toBe(false);
      expect(v.toCanonical(ymd)).toFailWith(/invalid Year-Month-Date/i);
    });
  });

  describe('isoAlpha2 region code', () => {
    const v = Validate.isoAlpha2RegionCode;
    const c = Converters.isoAlpha2RegionCode;

    test.each(['US', 'DE', 'FR'])('%p is a well-formed canonical ISO alpha-2 region code', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as IsoAlpha2RegionCode);
      expect(c.convert(code)).toSucceedWith(code as IsoAlpha2RegionCode);

      expect(v.isCanonical(code)).toBe(true);
      expect(v.toCanonical(code)).toSucceedWith(code as IsoAlpha2RegionCode);
    });

    test.each(['us', 'De', 'fR'])('%p is a well-formed non-canonical ISO alpha-2 region code', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as IsoAlpha2RegionCode);
      expect(c.convert(code)).toSucceedWith(code as IsoAlpha2RegionCode);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toUpperCase() as IsoAlpha2RegionCode);
    });

    test.each(['usa', 'Deutschland', 'f', '12'])(
      '%p is not a well-formed or canonical ISO alpha-2 region code',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*alpha-2/i);
        expect(c.convert(code)).toFailWith(/invalid.*alpha-2/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*alpha-2/i);
      }
    );
  });

  describe('isoAlpha3 region code', () => {
    const v = Validate.isoAlpha3RegionCode;
    const c = Converters.isoAlpha3RegionCode;
    test.each(['USA', 'DEU', 'FRA'])('%p is a well-formed canonical ISO alpha-3 region code', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as IsoAlpha3RegionCode);
      expect(c.convert(code)).toSucceedWith(code as IsoAlpha3RegionCode);

      expect(v.isCanonical(code)).toBe(true);
      expect(v.toCanonical(code)).toSucceedWith(code as IsoAlpha3RegionCode);
    });

    test.each(['usa', 'Deu', 'fRa', 'jpN'])(
      '%p is a well-formed non-canonical ISO alpha-3 region code',
      (code) => {
        expect(v.isWellFormed(code)).toBe(true);
        expect(v.converter.convert(code)).toSucceedWith(code as IsoAlpha3RegionCode);
        expect(c.convert(code)).toSucceedWith(code as IsoAlpha3RegionCode);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toSucceedWith(code.toUpperCase() as IsoAlpha3RegionCode);
      }
    );

    test.each(['us', 'Deutschland', 'f', '123'])(
      '%p is not a well-formed or canonical ISO alpha-3 region code',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*alpha-3/i);
        expect(c.convert(code)).toFailWith(/invalid.*alpha-3/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*alpha-3/i);
      }
    );
  });

  describe('un M.49 region code', () => {
    const v = Validate.unM49RegionCode;
    const c = Converters.unM49RegionCode;

    test.each(['001', '419', '999'])('%p is a well-formed and canonical UN M.49 region code', (ymd) => {
      expect(v.isWellFormed(ymd)).toBe(true);
      expect(v.converter.convert(ymd)).toSucceedWith(ymd as UnM49RegionCode);
      expect(c.convert(ymd)).toSucceedWith(ymd as UnM49RegionCode);

      expect(v.isCanonical(ymd)).toBe(true);
      expect(v.toCanonical(ymd)).toSucceedWith(ymd as UnM49RegionCode);
    });

    test.each(['1', '01', '1111', 'ABC'])(
      '%p is not a well-formed or canonical UN M.49 region code',
      (ymd) => {
        expect(v.isWellFormed(ymd)).toBe(false);
        expect(v.converter.convert(ymd)).toFailWith(/invalid.*m.49/i);
        expect(c.convert(ymd)).toFailWith(/invalid.*m.49/i);

        expect(v.isCanonical(ymd)).toBe(false);
        expect(v.toCanonical(ymd)).toFailWith(/invalid.*m.49/i);
      }
    );
  });
});
