/*
 * Copyright (c) 2026 Erik Fortune
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
import { qualifierDeclsConverter } from '../../../packlets/converters';

describe('qualifierDeclsConverter', () => {
  describe('success cases', () => {
    test('converts a valid qualifiers config with a single qualifier', () => {
      const input = {
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 1
          }
        ]
      };
      expect(qualifierDeclsConverter.convert(input)).toSucceedAndSatisfy((decls) => {
        expect(decls).toHaveLength(1);
        expect(decls[0].name).toBe('language');
        expect(decls[0].typeName).toBe('language');
        expect(decls[0].defaultPriority).toBe(1);
      });
    });

    test('converts a valid qualifiers config with multiple qualifiers', () => {
      const input = {
        qualifiers: [
          { name: 'language', typeName: 'language', defaultPriority: 1 },
          { name: 'region', typeName: 'region', defaultPriority: 2 }
        ]
      };
      expect(qualifierDeclsConverter.convert(input)).toSucceedAndSatisfy((decls) => {
        expect(decls).toHaveLength(2);
        expect(decls[1].name).toBe('region');
      });
    });

    test('converts a qualifier with optional token field', () => {
      const input = {
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 1,
            token: 'lang',
            tokenIsOptional: true
          }
        ]
      };
      expect(qualifierDeclsConverter.convert(input)).toSucceedAndSatisfy((decls) => {
        expect(decls[0].token).toBe('lang');
        expect(decls[0].tokenIsOptional).toBe(true);
      });
    });

    test('converts a qualifier with optional defaultValue field', () => {
      const input = {
        qualifiers: [
          {
            name: 'region',
            typeName: 'region',
            defaultPriority: 5,
            defaultValue: 'US'
          }
        ]
      };
      expect(qualifierDeclsConverter.convert(input)).toSucceedAndSatisfy((decls) => {
        expect(decls[0].defaultValue).toBe('US');
      });
    });

    test('converts an empty qualifiers array', () => {
      const input = { qualifiers: [] };
      expect(qualifierDeclsConverter.convert(input)).toSucceedAndSatisfy((decls) => {
        expect(decls).toHaveLength(0);
      });
    });
  });

  describe('failure cases', () => {
    test('fails when qualifiers field is missing', () => {
      expect(qualifierDeclsConverter.convert({})).toFail();
    });

    test('fails when input is not an object', () => {
      expect(qualifierDeclsConverter.convert('not-an-object')).toFail();
    });

    test('fails when input is null', () => {
      expect(qualifierDeclsConverter.convert(null)).toFail();
    });

    test('fails when qualifiers is not an array', () => {
      expect(qualifierDeclsConverter.convert({ qualifiers: 'not-an-array' })).toFail();
    });

    test('fails when a qualifier entry is missing name', () => {
      const input = {
        qualifiers: [{ typeName: 'language', defaultPriority: 1 }]
      };
      expect(qualifierDeclsConverter.convert(input)).toFail();
    });

    test('fails when a qualifier entry is missing typeName', () => {
      const input = {
        qualifiers: [{ name: 'language', defaultPriority: 1 }]
      };
      expect(qualifierDeclsConverter.convert(input)).toFail();
    });

    test('fails when a qualifier entry is missing defaultPriority', () => {
      const input = {
        qualifiers: [{ name: 'language', typeName: 'language' }]
      };
      expect(qualifierDeclsConverter.convert(input)).toFail();
    });

    test('fails when defaultPriority is not a number', () => {
      const input = {
        qualifiers: [{ name: 'language', typeName: 'language', defaultPriority: 'high' }]
      };
      expect(qualifierDeclsConverter.convert(input)).toFail();
    });
  });
});
