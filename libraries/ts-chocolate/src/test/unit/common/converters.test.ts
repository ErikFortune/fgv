// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import { Converters } from '../../../packlets/common';

describe('Common Converters', () => {
  // ============================================================================
  // kebabCase Tests
  // ============================================================================

  describe('kebabCase', () => {
    test('accepts valid kebab-case strings', () => {
      expect(Converters.kebabCase.convert('hello-world')).toSucceedWith('hello-world');
      expect(Converters.kebabCase.convert('test')).toSucceedWith('test');
      expect(Converters.kebabCase.convert('my-test-string')).toSucceedWith('my-test-string');
      expect(Converters.kebabCase.convert('test123')).toSucceedWith('test123');
      expect(Converters.kebabCase.convert('test-123-abc')).toSucceedWith('test-123-abc');
    });

    test('rejects non-string values', () => {
      expect(Converters.kebabCase.convert(123)).toFailWith(/must be a string/i);
      expect(Converters.kebabCase.convert(null)).toFailWith(/must be a string/i);
      expect(Converters.kebabCase.convert(undefined)).toFailWith(/must be a string/i);
      expect(Converters.kebabCase.convert({})).toFailWith(/must be a string/i);
      expect(Converters.kebabCase.convert([])).toFailWith(/must be a string/i);
    });

    test('rejects empty strings', () => {
      expect(Converters.kebabCase.convert('')).toFailWith(/cannot be empty/i);
    });

    test('rejects strings with uppercase letters', () => {
      expect(Converters.kebabCase.convert('Hello-World')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('HELLO')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('helloWorld')).toFailWith(/kebab-case format/i);
    });

    test('rejects strings with spaces', () => {
      expect(Converters.kebabCase.convert('hello world')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('hello-world ')).toFailWith(/kebab-case format/i);
    });

    test('rejects strings with underscores', () => {
      expect(Converters.kebabCase.convert('hello_world')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('test_123')).toFailWith(/kebab-case format/i);
    });

    test('rejects strings with consecutive hyphens', () => {
      expect(Converters.kebabCase.convert('hello--world')).toFailWith(/kebab-case format/i);
    });

    test('rejects strings starting or ending with hyphens', () => {
      expect(Converters.kebabCase.convert('-hello')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('hello-')).toFailWith(/kebab-case format/i);
    });

    test('rejects strings with special characters', () => {
      expect(Converters.kebabCase.convert('hello@world')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('hello.world')).toFailWith(/kebab-case format/i);
      expect(Converters.kebabCase.convert('hello/world')).toFailWith(/kebab-case format/i);
    });
  });

  // ============================================================================
  // nonEmptyString Tests
  // ============================================================================

  describe('nonEmptyString', () => {
    test('accepts non-empty strings', () => {
      expect(Converters.nonEmptyString.convert('hello')).toSucceedWith('hello');
      expect(Converters.nonEmptyString.convert('  hello  ')).toSucceedWith('  hello  ');
      expect(Converters.nonEmptyString.convert('123')).toSucceedWith('123');
      expect(Converters.nonEmptyString.convert(' a ')).toSucceedWith(' a ');
    });

    test('rejects non-string values', () => {
      expect(Converters.nonEmptyString.convert(123)).toFailWith(/must be a string/i);
      expect(Converters.nonEmptyString.convert(null)).toFailWith(/must be a string/i);
      expect(Converters.nonEmptyString.convert(undefined)).toFailWith(/must be a string/i);
      expect(Converters.nonEmptyString.convert({})).toFailWith(/must be a string/i);
      expect(Converters.nonEmptyString.convert([])).toFailWith(/must be a string/i);
    });

    test('rejects empty strings', () => {
      expect(Converters.nonEmptyString.convert('')).toFailWith(/cannot be empty/i);
    });

    test('rejects strings with only whitespace', () => {
      expect(Converters.nonEmptyString.convert('   ')).toFailWith(/cannot be empty/i);
      expect(Converters.nonEmptyString.convert('\t')).toFailWith(/cannot be empty/i);
      expect(Converters.nonEmptyString.convert('\n')).toFailWith(/cannot be empty/i);
      expect(Converters.nonEmptyString.convert('  \t\n  ')).toFailWith(/cannot be empty/i);
    });
  });

  // ============================================================================
  // positiveNumber Tests
  // ============================================================================

  describe('positiveNumber', () => {
    test('accepts zero', () => {
      expect(Converters.positiveNumber.convert(0)).toSucceedWith(0);
    });

    test('accepts positive integers', () => {
      expect(Converters.positiveNumber.convert(1)).toSucceedWith(1);
      expect(Converters.positiveNumber.convert(100)).toSucceedWith(100);
      expect(Converters.positiveNumber.convert(999999)).toSucceedWith(999999);
    });

    test('accepts positive decimals', () => {
      expect(Converters.positiveNumber.convert(0.1)).toSucceedWith(0.1);
      expect(Converters.positiveNumber.convert(3.14)).toSucceedWith(3.14);
      expect(Converters.positiveNumber.convert(99.99)).toSucceedWith(99.99);
    });

    test('rejects negative numbers', () => {
      expect(Converters.positiveNumber.convert(-1)).toFailWith(/must be positive/i);
      expect(Converters.positiveNumber.convert(-0.1)).toFailWith(/must be positive/i);
      expect(Converters.positiveNumber.convert(-100)).toFailWith(/must be positive/i);
    });

    test('rejects NaN', () => {
      expect(Converters.positiveNumber.convert(NaN)).toFailWith(/must be a number/i);
    });

    test('rejects non-number values', () => {
      expect(Converters.positiveNumber.convert('123')).toFailWith(/must be a number/i);
      expect(Converters.positiveNumber.convert(null)).toFailWith(/must be a number/i);
      expect(Converters.positiveNumber.convert(undefined)).toFailWith(/must be a number/i);
      expect(Converters.positiveNumber.convert({})).toFailWith(/must be a number/i);
      expect(Converters.positiveNumber.convert([])).toFailWith(/must be a number/i);
    });
  });

  // ============================================================================
  // numberInRange Tests
  // ============================================================================

  describe('numberInRange', () => {
    test('accepts numbers within range', () => {
      const converter = Converters.numberInRange(0, 100);
      expect(converter.convert(0)).toSucceedWith(0);
      expect(converter.convert(50)).toSucceedWith(50);
      expect(converter.convert(100)).toSucceedWith(100);
    });

    test('accepts numbers at boundaries', () => {
      const converter = Converters.numberInRange(-10, 10);
      expect(converter.convert(-10)).toSucceedWith(-10);
      expect(converter.convert(10)).toSucceedWith(10);
    });

    test('accepts decimals in range', () => {
      const converter = Converters.numberInRange(0.0, 1.0);
      expect(converter.convert(0.0)).toSucceedWith(0.0);
      expect(converter.convert(0.5)).toSucceedWith(0.5);
      expect(converter.convert(1.0)).toSucceedWith(1.0);
    });

    test('rejects numbers below minimum', () => {
      const converter = Converters.numberInRange(0, 100);
      expect(converter.convert(-1)).toFailWith(/between 0 and 100/i);
      expect(converter.convert(-0.1)).toFailWith(/between 0 and 100/i);
    });

    test('rejects numbers above maximum', () => {
      const converter = Converters.numberInRange(0, 100);
      expect(converter.convert(101)).toFailWith(/between 0 and 100/i);
      expect(converter.convert(100.1)).toFailWith(/between 0 and 100/i);
    });

    test('works with negative ranges', () => {
      const converter = Converters.numberInRange(-100, -10);
      expect(converter.convert(-50)).toSucceedWith(-50);
      expect(converter.convert(-100)).toSucceedWith(-100);
      expect(converter.convert(-10)).toSucceedWith(-10);
      expect(converter.convert(0)).toFailWith(/between -100 and -10/i);
      expect(converter.convert(-101)).toFailWith(/between -100 and -10/i);
    });

    test('rejects NaN', () => {
      const converter = Converters.numberInRange(0, 100);
      expect(converter.convert(NaN)).toFailWith(/must be a number/i);
    });

    test('rejects non-number values', () => {
      const converter = Converters.numberInRange(0, 100);
      expect(converter.convert('50')).toFailWith(/must be a number/i);
      expect(converter.convert(null)).toFailWith(/must be a number/i);
      expect(converter.convert(undefined)).toFailWith(/must be a number/i);
      expect(converter.convert({})).toFailWith(/must be a number/i);
      expect(converter.convert([])).toFailWith(/must be a number/i);
    });

    test('works with single value range', () => {
      const converter = Converters.numberInRange(42, 42);
      expect(converter.convert(42)).toSucceedWith(42);
      expect(converter.convert(41)).toFailWith(/between 42 and 42/i);
      expect(converter.convert(43)).toFailWith(/between 42 and 42/i);
    });
  });
});
