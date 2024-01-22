/*
 * Copyright (c) 2024 Erik Fortune
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
import { Converters, sanitizeJson } from '../..';

describe('converters', () => {
  const validPrimitiveTests = [
    { description: 'boolean (true)', value: true },
    { description: 'boolean (false)', value: false },
    { description: 'number (positive)', value: 100 },
    { description: 'number (negative)', value: -100 },
    { description: 'number (zero)', value: 0 },
    { description: 'string', value: 'some string value' },
    { description: 'null', value: null }
  ];
  const validObjectTests = [
    {
      description: 'valid object',
      value: {
        someString: 'some',
        someNumber: 10,
        someBool: false,
        someArray: [10, true, 'value'],
        someObject: {}
      }
    }
  ];
  const validArrayTests = [
    {
      description: 'a valid array',
      value: [
        {
          someString: 'some',
          someNumber: 10,
          someBool: false,
          someArray: [10, true, 'value'],
          someObject: {}
        },
        10,
        'hello',
        true
      ]
    }
  ];
  const invalidJsonTests = [
    { description: 'NaN', value: Number.NaN, expectedError: /not.*valid json/i },
    { description: 'Symbol', value: Symbol('value'), expectedError: /not.*valid json/i },
    { description: 'a RegExp', value: /test/i, expectedError: /not.*valid json/i },
    { description: 'a Date', value: new Date(), expectedError: /not.*valid json/i },
    {
      description: 'an object with an invalid property',
      value: { invalid: /true/i },
      expectedError: /not.*valid json/i
    },
    {
      description: 'an object with nested invalid property',
      value: {
        invalid: [/bad/i]
      },
      expectedError: /not.*valid json/i
    }
  ];
  const jsonWithUndefinedTests = [
    { description: 'undefined', value: undefined, expectedError: /undefined.*not.*valid/i }
  ];
  const jsonObjectWithUndefinedTests = [
    {
      description: 'an object with undefined property',
      value: { invalid: undefined },
      expectedError: /undefined.*not.*valid/i
    }
  ];
  const jsonArrayWithUndefinedTests = [
    {
      description: 'array containing objects with undefined properties',
      value: [{ good: 'str', bad: undefined }],
      expectedError: /undefined.*not.*valid/i
    },
    {
      description: 'array containing undefined',
      value: [{ good: 'str' }, undefined, 'hello'],
      expectedError: /undefined.*not.*valid/i
    }
  ];

  describe('jsonPrimitive', () => {
    const converter = Converters.jsonPrimitive;
    test.each(validPrimitiveTests)('succeeds for $description', (tc) => {
      expect(converter.convert(tc.value)).toSucceedAndSatisfy((v) => {
        expect(v).toEqual(tc.value);
      });
    });

    test.each([
      { description: 'object', value: {}, expectedError: /not a valid json primitive/i },
      { description: 'array', value: [], expectedError: /not a valid json primitive/i },
      ...invalidJsonTests,
      ...jsonWithUndefinedTests
    ])('fails for $description', (tc) => {
      expect(converter.convert(tc.value)).toFailWith(tc.expectedError);
    });
  });

  describe('jsonObject', () => {
    const converter = Converters.jsonObject;
    test.each(validObjectTests)('succeeds for $description', (tc) => {
      expect(converter.convert(tc.value)).toSucceedAndSatisfy((v) => {
        // explicitly test for equality but not identity (copying converter)
        expect(v).toEqual(sanitizeJson(tc.value).orThrow());
        expect(v).not.toBe(tc.value);
      });
    });

    test.each([
      ...invalidJsonTests,
      ...jsonObjectWithUndefinedTests,
      ...validPrimitiveTests.map((t) => {
        return { ...t, expectedError: /not a valid json object/i };
      }),
      ...validArrayTests.map((t) => {
        return { ...t, expectedError: /not a valid json object/i };
      }),
      { description: 'null', value: null, expectedError: /not a valid json object/i }
    ])('fails for $description', (tc) => {
      expect(converter.convert(tc.value)).toFailWith(tc.expectedError);
    });

    test('ignores undefined properties if specified in context', () => {
      const obj = {
        good: 'good',
        bad: undefined
      };

      expect(converter.convert(obj)).toFailWith(/undefined.*not.*valid/);
      expect(converter.convert(obj, { ignoreUndefinedProperties: true })).toSucceedAndSatisfy((v) => {
        // verify equality but not identity (copying converter)
        expect(v).toEqual(sanitizeJson(obj).orThrow());
        expect(v).not.toBe(obj);
      });
    });
  });

  describe('jsonArray', () => {
    const converter = Converters.jsonArray;

    test.each(validArrayTests)('succeeds for $description', (tc) => {
      expect(converter.convert(tc.value)).toSucceedAndSatisfy((v) => {
        // explicitly test for equality but not identity (copying converter)
        expect(v).toEqual(sanitizeJson(tc.value).orThrow());
        expect(v).not.toBe(tc.value);
      });
    });

    test.each([
      ...invalidJsonTests.map((t) => {
        return { ...t, expectedError: /not an array/i };
      }),
      ...validPrimitiveTests.map((t) => {
        return { ...t, expectedError: /not an array/i };
      }),
      ...validObjectTests.map((t) => {
        return { ...t, expectedError: /not an array/i };
      }),
      ...jsonArrayWithUndefinedTests
    ])('fails for $description', (tc) => {
      expect(converter.convert(tc.value)).toFailWith(tc.expectedError);
    });

    test('ignores undefined properties if specified in context', () => {
      const arr = [
        {
          good: 'good',
          bad: undefined
        },
        undefined
      ];

      expect(converter.convert(arr)).toFailWith(/undefined.*not.*valid/);
      expect(converter.convert(arr, { ignoreUndefinedProperties: true })).toSucceedAndSatisfy((v) => {
        // explicitly test equality but not identity (copying converter)
        expect(v).toEqual(sanitizeJson(arr).orThrow());
        expect(v).not.toBe(arr);
      });
    });
  });

  describe('jsonValue', () => {
    const converter = Converters.jsonValue;

    test.each([...validPrimitiveTests, ...validObjectTests, ...validArrayTests])(
      'succeeds for $description',
      (tc) => {
        expect(converter.convert(tc.value)).toSucceedAndSatisfy((v) => {
          // explicitly test for equality but not identity for object and array (copying converter)
          expect(v).toEqual(tc.value);
          if (typeof v === 'object' && v !== null) {
            expect(v).not.toBe(tc.value);
          }
        });
      }
    );

    test.each([...invalidJsonTests, ...jsonWithUndefinedTests, ...jsonWithUndefinedTests])(
      'fails for $description',
      (tc) => {
        expect(converter.convert(tc.value)).toFailWith(tc.expectedError);
      }
    );

    test.each([...jsonObjectWithUndefinedTests, ...jsonArrayWithUndefinedTests])(
      'succeeds for $description if configured to ignore undefined',
      (tc) => {
        expect(converter.convert(tc.value, { ignoreUndefinedProperties: true })).toSucceedAndSatisfy((v) => {
          // explicitly equality but not identity (copying converter)
          expect(v).toEqual(sanitizeJson(tc.value).orThrow());
          expect(v).not.toBe(tc.value);
        });
      }
    );
  });
});
