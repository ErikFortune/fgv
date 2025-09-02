/*
 * Copyright (c) 2025 Erik Fortune
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
import * as TsRes from '../../../../index';

describe('Condition helpers', () => {
  describe('buildConditionToken', () => {
    test('builds a token from a qualifier and value', () => {
      const qualifier = 'someQualifier';
      const value = 'someValue';
      expect(TsRes.Helpers.buildConditionToken({ qualifier, value })).toSucceedWith(
        'someQualifier=someValue' as unknown as TsRes.ConditionToken
      );
    });

    test('builds a token from just a value', () => {
      const value = 'someValue';
      expect(TsRes.Helpers.buildConditionToken({ value })).toSucceedWith(
        'someValue' as unknown as TsRes.ConditionToken
      );
    });

    test('fails if qualifier is not a valid qualifier name', () => {
      const qualifier = 'bogus qualifier';
      const value = 'someValue';
      expect(TsRes.Helpers.buildConditionToken({ qualifier, value })).toFailWith(
        /not a valid condition token/i
      );
    });

    test('fails if value is not a valid value', () => {
      const qualifier = 'someQualifier';
      const value = 'bogus/value';
      expect(TsRes.Helpers.buildConditionToken({ qualifier, value })).toFailWith(
        /not a valid condition token/i
      );
    });
  });

  describe('buildConditionSetToken', () => {
    test('builds a token from an array of token parts', () => {
      const tokens: TsRes.Helpers.IConditionTokenParts[] = [
        { qualifier: 'qualifier1', value: 'value1' },
        { qualifier: 'qualifier2', value: 'value2' }
      ];
      expect(TsRes.Helpers.buildConditionSetToken(tokens)).toSucceedWith(
        'qualifier1=value1,qualifier2=value2' as TsRes.ConditionSetToken
      );
    });

    test('builds if one of the parts has no qualifier', () => {
      const tokens: TsRes.Helpers.IConditionTokenParts[] = [
        { value: 'value1' },
        { qualifier: 'qualifier2', value: 'value2' }
      ];
      expect(TsRes.Helpers.buildConditionSetToken(tokens)).toSucceedWith(
        'value1,qualifier2=value2' as TsRes.ConditionSetToken
      );
    });

    test('fails if one of the parts is invalid', () => {
      const tokens: TsRes.Helpers.IConditionTokenParts[] = [
        { qualifier: 'qualifier1', value: 'value1' },
        { qualifier: 'qualifier2', value: 'bogus/value' }
      ];
      expect(TsRes.Helpers.buildConditionSetToken(tokens)).toFailWith(/not a valid condition token/i);
    });
  });

  describe('parseConditionTokenParts', () => {
    test('parses a token with a qualifier and value', () => {
      expect(TsRes.Helpers.parseConditionTokenParts('qualifier=value')).toSucceedWith({
        qualifier: 'qualifier',
        value: 'value'
      });
    });

    test('parses a token with just a value', () => {
      expect(TsRes.Helpers.parseConditionTokenParts('value')).toSucceedWith({ value: 'value' });
    });

    test('fails if the token is not a valid condition token', () => {
      expect(TsRes.Helpers.parseConditionTokenParts('bogus token')).toFailWith(
        /not a valid condition token/i
      );
    });
  });

  describe('parseConditionSetTokenParts', () => {
    test('parses a set of tokens', () => {
      expect(TsRes.Helpers.parseConditionSetTokenParts('qualifier1=value1,qualifier2=value2')).toSucceedWith([
        { qualifier: 'qualifier1', value: 'value1' },
        { qualifier: 'qualifier2', value: 'value2' }
      ]);
    });

    test('parses a set of tokens with one missing qualifier', () => {
      expect(TsRes.Helpers.parseConditionSetTokenParts('value1,qualifier2=value2')).toSucceedWith([
        { value: 'value1' },
        { qualifier: 'qualifier2', value: 'value2' }
      ]);
    });

    test('fails if one of the tokens is invalid', () => {
      expect(
        TsRes.Helpers.parseConditionSetTokenParts('qualifier1=value1,qualifier2=bogus/value')
      ).toFailWith(/not a valid condition token/i);
    });
  });
});
