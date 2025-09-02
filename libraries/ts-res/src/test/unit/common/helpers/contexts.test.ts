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

describe('Context helpers', () => {
  describe('buildContextQualifierToken', () => {
    test('builds a token from a qualifier and value', () => {
      const qualifier = 'language';
      const value = 'en-US';
      expect(TsRes.Helpers.buildContextQualifierToken({ qualifier, value })).toSucceedWith(
        'language=en-US' as unknown as TsRes.ContextQualifierToken
      );
    });

    test('builds a token from a qualifier and comma-separated value', () => {
      const qualifier = 'language';
      const value = 'en-US, de-DE';
      expect(TsRes.Helpers.buildContextQualifierToken({ qualifier, value })).toSucceedWith(
        'language=en-US, de-DE' as unknown as TsRes.ContextQualifierToken
      );
    });

    test('builds a token from just a value', () => {
      const value = 'en-US';
      expect(TsRes.Helpers.buildContextQualifierToken({ value })).toSucceedWith(
        'en-US' as unknown as TsRes.ContextQualifierToken
      );
    });

    test('fails if qualifier is not a valid qualifier name', () => {
      const qualifier = 'bogus qualifier';
      const value = 'en-US';
      expect(TsRes.Helpers.buildContextQualifierToken({ qualifier, value })).toFailWith(
        /not a valid context qualifier token/i
      );
    });

    test('fails if value is empty', () => {
      const qualifier = 'language';
      const value = '';
      expect(TsRes.Helpers.buildContextQualifierToken({ qualifier, value })).toFailWith(
        /not a valid context qualifier token/i
      );
    });
  });

  describe('buildContextToken', () => {
    test('builds a context token from multiple parts', () => {
      const parts = [
        { qualifier: 'language', value: 'en-US, de-DE' },
        { qualifier: 'territory', value: 'US' },
        { value: 'admin' }
      ];
      expect(TsRes.Helpers.buildContextToken(parts)).toSucceedWith(
        'language=en-US, de-DE|territory=US|admin' as unknown as TsRes.ContextToken
      );
    });

    test('builds a context token from single part', () => {
      const parts = [{ qualifier: 'language', value: 'en-US' }];
      expect(TsRes.Helpers.buildContextToken(parts)).toSucceedWith(
        'language=en-US' as unknown as TsRes.ContextToken
      );
    });

    test('builds empty context token from empty array', () => {
      const parts: TsRes.Helpers.IContextTokenParts[] = [];
      expect(TsRes.Helpers.buildContextToken(parts)).toSucceedWith('' as unknown as TsRes.ContextToken);
    });

    test('fails if any part is invalid', () => {
      const parts = [
        { qualifier: 'language', value: 'en-US' },
        { qualifier: 'bad qualifier', value: 'US' }
      ];
      expect(TsRes.Helpers.buildContextToken(parts)).toFailWith(/not a valid context qualifier token/i);
    });
  });

  describe('parseContextQualifierTokenParts', () => {
    test('parses token with qualifier and value', () => {
      const token = 'language=en-US, de-DE' as unknown as TsRes.ContextQualifierToken;
      expect(TsRes.Helpers.parseContextQualifierTokenParts(token)).toSucceedWith({
        qualifier: 'language',
        value: 'en-US, de-DE'
      });
    });

    test('parses token with just value', () => {
      const token = 'en-US' as unknown as TsRes.ContextQualifierToken;
      expect(TsRes.Helpers.parseContextQualifierTokenParts(token)).toSucceedWith({
        value: 'en-US'
      });
    });

    test('fails for invalid token', () => {
      const token = 'invalid token' as unknown as TsRes.ContextQualifierToken;
      expect(TsRes.Helpers.parseContextQualifierTokenParts(token)).toFailWith(
        /not a valid context qualifier token/i
      );
    });
  });

  describe('parseContextTokenParts', () => {
    test('parses context token with multiple parts', () => {
      const token = 'language=en-US, de-DE|territory=US|admin' as unknown as TsRes.ContextToken;
      expect(TsRes.Helpers.parseContextTokenParts(token)).toSucceedWith([
        { qualifier: 'language', value: 'en-US, de-DE' },
        { qualifier: 'territory', value: 'US' },
        { value: 'admin' }
      ]);
    });

    test('parses context token with single part', () => {
      const token = 'language=en-US' as unknown as TsRes.ContextToken;
      expect(TsRes.Helpers.parseContextTokenParts(token)).toSucceedWith([
        { qualifier: 'language', value: 'en-US' }
      ]);
    });

    test('handles whitespace around pipe separators', () => {
      const token = 'language=en-US | territory=US | admin' as unknown as TsRes.ContextToken;
      expect(TsRes.Helpers.parseContextTokenParts(token)).toSucceedWith([
        { qualifier: 'language', value: 'en-US' },
        { qualifier: 'territory', value: 'US' },
        { value: 'admin' }
      ]);
    });

    test('fails if any part is invalid', () => {
      const token = 'language=en-US|bad token' as unknown as TsRes.ContextToken;
      expect(TsRes.Helpers.parseContextTokenParts(token)).toFailWith(/not a valid context qualifier token/i);
    });
  });
});
