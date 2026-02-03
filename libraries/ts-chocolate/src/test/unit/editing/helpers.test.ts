// Copyright (c) 2024 Erik Fortune
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

import { Converters, Helpers, Validation } from '../../../packlets/common';

// Helper for validatePercentage test
function validatePercentage(
  value: unknown,
  fieldName: string
): ReturnType<typeof Converters.percentage.convert> {
  return Converters.percentage
    .convert(value)
    .withErrorFormat(() => `${fieldName}: must be between 0 and 100`);
}

describe('toKebabCase', () => {
  test('should convert simple string to kebab-case', () => {
    expect(Helpers.toKebabCase('Hello World')).toBe('hello-world');
  });

  test('should handle already kebab-case string', () => {
    expect(Helpers.toKebabCase('hello-world')).toBe('hello-world');
  });

  test('should handle uppercase', () => {
    expect(Helpers.toKebabCase('HELLO WORLD')).toBe('hello-world');
  });

  test('should handle mixed case', () => {
    expect(Helpers.toKebabCase('HelloWorld')).toBe('helloworld');
  });

  test('should replace special characters with hyphens', () => {
    expect(Helpers.toKebabCase('hello & world')).toBe('hello-world');
    expect(Helpers.toKebabCase('hello@world')).toBe('hello-world');
    expect(Helpers.toKebabCase('hello_world')).toBe('hello-world');
  });

  test('should remove leading/trailing hyphens', () => {
    expect(Helpers.toKebabCase(' hello world ')).toBe('hello-world');
    expect(Helpers.toKebabCase('--hello--')).toBe('hello');
  });

  test('should handle multiple consecutive special characters', () => {
    expect(Helpers.toKebabCase('hello   world')).toBe('hello-world');
    expect(Helpers.toKebabCase('hello---world')).toBe('hello-world');
  });

  test('should handle numbers', () => {
    expect(Helpers.toKebabCase('hello 123 world')).toBe('hello-123-world');
  });

  test('should handle empty string', () => {
    expect(Helpers.toKebabCase('')).toBe('');
  });

  test('should handle whitespace only', () => {
    expect(Helpers.toKebabCase('   ')).toBe('');
  });
});

describe('validateKebabCase', () => {
  test('should succeed for valid kebab-case', () => {
    expect(Validation.validateKebabCase('hello-world')).toSucceed();
    expect(Validation.validateKebabCase('hello')).toSucceed();
    expect(Validation.validateKebabCase('hello-123')).toSucceed();
    expect(Validation.validateKebabCase('123-hello')).toSucceed();
  });

  test('should fail for empty string', () => {
    expect(Validation.validateKebabCase('')).toFailWith(/cannot be empty/i);
  });

  test('should fail for uppercase', () => {
    expect(Validation.validateKebabCase('Hello-World')).toFailWith(/kebab-case format/i);
  });

  test('should fail for spaces', () => {
    expect(Validation.validateKebabCase('hello world')).toFailWith(/kebab-case format/i);
  });

  test('should fail for special characters', () => {
    expect(Validation.validateKebabCase('hello_world')).toFailWith(/kebab-case format/i);
    expect(Validation.validateKebabCase('hello@world')).toFailWith(/kebab-case format/i);
  });

  test('should fail for leading/trailing hyphens', () => {
    expect(Validation.validateKebabCase('-hello')).toFailWith(/kebab-case format/i);
    expect(Validation.validateKebabCase('hello-')).toFailWith(/kebab-case format/i);
  });

  test('should fail for consecutive hyphens', () => {
    expect(Validation.validateKebabCase('hello--world')).toFailWith(/kebab-case format/i);
  });
});

describe('nameToBaseId', () => {
  test('should convert name to base ID', () => {
    expect(Helpers.nameToBaseId('Hello World')).toSucceedWith('hello-world');
    expect(Helpers.nameToBaseId('Test Ingredient')).toSucceedWith('test-ingredient');
  });

  test('should handle special characters', () => {
    expect(Helpers.nameToBaseId('Hello & World')).toSucceedWith('hello-world');
    expect(Helpers.nameToBaseId('Test@123')).toSucceedWith('test-123');
  });

  test('should fail for empty name', () => {
    expect(Helpers.nameToBaseId('')).toFailWith(/cannot be empty/i);
    expect(Helpers.nameToBaseId('   ')).toFailWith(/cannot be empty/i);
  });

  test('should fail for name with no alphanumeric characters', () => {
    expect(Helpers.nameToBaseId('---')).toFailWith(/at least one alphanumeric/i);
    expect(Helpers.nameToBaseId('@@@')).toFailWith(/at least one alphanumeric/i);
  });

  test('should trim whitespace', () => {
    expect(Helpers.nameToBaseId('  hello  ')).toSucceedWith('hello');
  });
});

describe('generateUniqueBaseId', () => {
  test('should return base ID if not in set', () => {
    const existingIds = new Set(['foo', 'bar']);
    expect(Helpers.generateUniqueBaseId('baz', existingIds)).toSucceedWith('baz');
  });

  test('should append counter if base ID exists', () => {
    const existingIds = new Set(['hello', 'world']);
    expect(Helpers.generateUniqueBaseId('hello', existingIds)).toSucceedWith('hello-2');
  });

  test('should increment counter until unique', () => {
    const existingIds = new Set(['hello', 'hello-2', 'hello-3']);
    expect(Helpers.generateUniqueBaseId('hello', existingIds)).toSucceedWith('hello-4');
  });

  test('should work with array input', () => {
    const existingIds = ['foo', 'bar'];
    expect(Helpers.generateUniqueBaseId('baz', existingIds)).toSucceedWith('baz');
  });

  test('should work with array containing duplicates', () => {
    const existingIds = ['hello', 'hello-2'];
    expect(Helpers.generateUniqueBaseId('hello', existingIds)).toSucceedWith('hello-3');
  });

  test('should fail after max attempts', () => {
    const existingIds = new Set(['hello', 'hello-2', 'hello-3']);
    expect(Helpers.generateUniqueBaseId('hello', existingIds, 2)).toFailWith(
      /could not generate.*after 2 attempts/i
    );
  });

  test('should handle large counter values', () => {
    const ids = ['test'];
    for (let i = 2; i <= 100; i++) {
      ids.push(`test-${i}`);
    }
    const existingIds = new Set(ids);
    expect(Helpers.generateUniqueBaseId('test', existingIds)).toSucceedWith('test-101');
  });
});

describe('generateUniqueBaseIdFromName', () => {
  test('should generate unique base ID from name', () => {
    const existingIds = new Set(['foo', 'bar']);
    expect(Helpers.generateUniqueBaseIdFromName('Hello World', existingIds)).toSucceedWith('hello-world');
  });

  test('should append counter if name collision', () => {
    const existingIds = new Set(['hello-world']);
    expect(Helpers.generateUniqueBaseIdFromName('Hello World', existingIds)).toSucceedWith('hello-world-2');
  });

  test('should fail for empty name', () => {
    expect(Helpers.generateUniqueBaseIdFromName('', new Set())).toFailWith(/cannot be empty/i);
  });

  test('should fail for invalid name', () => {
    expect(Helpers.generateUniqueBaseIdFromName('---', new Set())).toFailWith(/at least one alphanumeric/i);
  });

  test('should work with custom max attempts', () => {
    const existingIds = new Set(['test', 'test-2', 'test-3']);
    expect(Helpers.generateUniqueBaseIdFromName('Test', existingIds, 2)).toFailWith(/after 2 attempts/i);
  });
});

describe('validateNonEmptyString', () => {
  test('should succeed for non-empty string', () => {
    expect(Validation.validateNonEmptyString('hello', 'name')).toSucceed();
    expect(Validation.validateNonEmptyString('a', 'name')).toSucceed();
    expect(Validation.validateNonEmptyString('  hello  ', 'name')).toSucceed();
  });

  test('should fail for empty string', () => {
    expect(Validation.validateNonEmptyString('', 'name')).toFailWith(/name cannot be empty/i);
    expect(Validation.validateNonEmptyString('   ', 'name')).toFailWith(/name cannot be empty/i);
  });

  test('should use field name in error message', () => {
    expect(Validation.validateNonEmptyString('', 'description')).toFailWith(/description cannot be empty/i);
  });
});

describe('validateStringLength', () => {
  test('should succeed for string within bounds', () => {
    expect(Validation.validateStringLength('hello', 'name', { minLength: 3, maxLength: 10 })).toSucceed();
  });

  test('should succeed for exact min length', () => {
    expect(Validation.validateStringLength('abc', 'name', { minLength: 3 })).toSucceed();
  });

  test('should succeed for exact max length', () => {
    expect(Validation.validateStringLength('hello', 'name', { maxLength: 5 })).toSucceed();
  });

  test('should fail for string too short', () => {
    expect(Validation.validateStringLength('ab', 'name', { minLength: 3 })).toFailWith(
      /at least 3 characters/i
    );
  });

  test('should fail for string too long', () => {
    expect(Validation.validateStringLength('hello world', 'name', { maxLength: 5 })).toFailWith(
      /at most 5 characters/i
    );
  });

  test('should validate only minLength', () => {
    expect(Validation.validateStringLength('hello', 'name', { minLength: 3 })).toSucceed();
    expect(Validation.validateStringLength('hi', 'name', { minLength: 3 })).toFailWith(/at least 3/i);
  });

  test('should validate only maxLength', () => {
    expect(Validation.validateStringLength('hello', 'name', { maxLength: 10 })).toSucceed();
    expect(Validation.validateStringLength('this is too long', 'name', { maxLength: 10 })).toFailWith(
      /at most 10/i
    );
  });
});

describe('validatePositiveNumber', () => {
  test('should succeed for positive numbers', () => {
    expect(Validation.validatePositiveNumber(1, 'count')).toSucceed();
    expect(Validation.validatePositiveNumber(100, 'count')).toSucceed();
    expect(Validation.validatePositiveNumber(0.5, 'count')).toSucceed();
  });

  test('should succeed for zero', () => {
    expect(Validation.validatePositiveNumber(0, 'count')).toSucceed();
  });

  test('should fail for negative numbers', () => {
    expect(Validation.validatePositiveNumber(-1, 'count')).toFailWith(/count must be positive/i);
    expect(Validation.validatePositiveNumber(-0.5, 'count')).toFailWith(/count must be positive/i);
  });

  test('should fail for non-numbers', () => {
    expect(Validation.validatePositiveNumber('5', 'count')).toFailWith(/count must be a number/i);
    expect(Validation.validatePositiveNumber(null, 'count')).toFailWith(/count must be a number/i);
  });

  test('should fail for NaN', () => {
    expect(Validation.validatePositiveNumber(NaN, 'count')).toFailWith(/count must be a number/i);
  });
});

describe('validateNumberRange', () => {
  test('should succeed for number in range', () => {
    expect(Validation.validateNumberRange(5, 'value', 0, 10)).toSucceed();
    expect(Validation.validateNumberRange(0, 'value', 0, 10)).toSucceed();
    expect(Validation.validateNumberRange(10, 'value', 0, 10)).toSucceed();
  });

  test('should fail for number below range', () => {
    expect(Validation.validateNumberRange(-1, 'value', 0, 10)).toFailWith(/value must be between 0 and 10/i);
  });

  test('should fail for number above range', () => {
    expect(Validation.validateNumberRange(11, 'value', 0, 10)).toFailWith(/value must be between 0 and 10/i);
  });

  test('should fail for non-numbers', () => {
    expect(Validation.validateNumberRange('5', 'value', 0, 10)).toFailWith(/value must be a number/i);
  });

  test('should fail for NaN', () => {
    expect(Validation.validateNumberRange(NaN, 'value', 0, 10)).toFailWith(/value must be a number/i);
  });

  test('should handle negative ranges', () => {
    expect(Validation.validateNumberRange(-5, 'value', -10, 0)).toSucceed();
    expect(Validation.validateNumberRange(-11, 'value', -10, 0)).toFailWith(/between -10 and 0/i);
  });
});

describe('validatePercentage', () => {
  test('should succeed for valid percentages', () => {
    expect(validatePercentage(0, 'percent')).toSucceed();
    expect(validatePercentage(50, 'percent')).toSucceed();
    expect(validatePercentage(100, 'percent')).toSucceed();
    expect(validatePercentage(25.5, 'percent')).toSucceed();
  });

  test('should fail for negative percentage', () => {
    expect(validatePercentage(-1, 'percent')).toFailWith(/must be between 0 and 100/i);
  });

  test('should fail for percentage over 100', () => {
    expect(validatePercentage(101, 'percent')).toFailWith(/must be between 0 and 100/i);
  });

  test('should fail for non-numbers', () => {
    expect(validatePercentage('50', 'percent')).toFailWith(/must be between 0 and 100/i);
  });
});

describe('baseIdExists', () => {
  test('should return true for existing ID in Set', () => {
    const ids = new Set(['foo', 'bar', 'baz']);
    expect(Validation.baseIdExists('foo', ids)).toBe(true);
    expect(Validation.baseIdExists('bar', ids)).toBe(true);
  });

  test('should return false for non-existing ID in Set', () => {
    const ids = new Set(['foo', 'bar']);
    expect(Validation.baseIdExists('baz', ids)).toBe(false);
  });

  test('should return true for existing ID in Array', () => {
    const ids = ['foo', 'bar', 'baz'];
    expect(Validation.baseIdExists('foo', ids)).toBe(true);
  });

  test('should return false for non-existing ID in Array', () => {
    const ids = ['foo', 'bar'];
    expect(Validation.baseIdExists('baz', ids)).toBe(false);
  });

  test('should handle empty Set', () => {
    expect(Validation.baseIdExists('foo', new Set())).toBe(false);
  });

  test('should handle empty Array', () => {
    expect(Validation.baseIdExists('foo', [])).toBe(false);
  });
});

describe('validateUniqueBaseId', () => {
  test('should succeed for unique ID', () => {
    const ids = new Set(['foo', 'bar']);
    expect(Validation.validateUniqueBaseId('baz', ids)).toSucceed();
  });

  test('should fail for duplicate ID', () => {
    const ids = new Set(['foo', 'bar']);
    expect(Validation.validateUniqueBaseId('foo', ids)).toFailWith(/foo.*already exists/i);
  });

  test('should work with array', () => {
    const ids = ['foo', 'bar'];
    expect(Validation.validateUniqueBaseId('baz', ids)).toSucceed();
    expect(Validation.validateUniqueBaseId('foo', ids)).toFailWith(/already exists/i);
  });

  test('should use custom field name in error', () => {
    const ids = new Set(['foo']);
    expect(Validation.validateUniqueBaseId('foo', ids, 'customId')).toFailWith(/customid/i);
  });

  test('should use default field name', () => {
    const ids = new Set(['foo']);
    expect(Validation.validateUniqueBaseId('foo', ids)).toFailWith(/baseid/i);
  });
});
