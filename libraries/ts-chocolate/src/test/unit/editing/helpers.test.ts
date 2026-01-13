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
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  toKebabCase,
  validateKebabCase,
  nameToBaseId,
  generateUniqueBaseId,
  generateUniqueBaseIdFromName,
  validateNonEmptyString,
  validateStringLength,
  validatePositiveNumber,
  validateNumberRange,
  validatePercentage,
  baseIdExists,
  validateUniqueBaseId
} from '../../../packlets/editing/helpers';

describe('toKebabCase', () => {
  test('should convert simple string to kebab-case', () => {
    expect(toKebabCase('Hello World')).toBe('hello-world');
  });

  test('should handle already kebab-case string', () => {
    expect(toKebabCase('hello-world')).toBe('hello-world');
  });

  test('should handle uppercase', () => {
    expect(toKebabCase('HELLO WORLD')).toBe('hello-world');
  });

  test('should handle mixed case', () => {
    expect(toKebabCase('HelloWorld')).toBe('helloworld');
  });

  test('should replace special characters with hyphens', () => {
    expect(toKebabCase('hello & world')).toBe('hello-world');
    expect(toKebabCase('hello@world')).toBe('hello-world');
    expect(toKebabCase('hello_world')).toBe('hello-world');
  });

  test('should remove leading/trailing hyphens', () => {
    expect(toKebabCase(' hello world ')).toBe('hello-world');
    expect(toKebabCase('--hello--')).toBe('hello');
  });

  test('should handle multiple consecutive special characters', () => {
    expect(toKebabCase('hello   world')).toBe('hello-world');
    expect(toKebabCase('hello---world')).toBe('hello-world');
  });

  test('should handle numbers', () => {
    expect(toKebabCase('hello 123 world')).toBe('hello-123-world');
  });

  test('should handle empty string', () => {
    expect(toKebabCase('')).toBe('');
  });

  test('should handle whitespace only', () => {
    expect(toKebabCase('   ')).toBe('');
  });
});

describe('validateKebabCase', () => {
  test('should succeed for valid kebab-case', () => {
    expect(validateKebabCase('hello-world')).toSucceed();
    expect(validateKebabCase('hello')).toSucceed();
    expect(validateKebabCase('hello-123')).toSucceed();
    expect(validateKebabCase('123-hello')).toSucceed();
  });

  test('should fail for empty string', () => {
    expect(validateKebabCase('')).toFailWith(/cannot be empty/i);
  });

  test('should fail for uppercase', () => {
    expect(validateKebabCase('Hello-World')).toFailWith(/kebab-case format/i);
  });

  test('should fail for spaces', () => {
    expect(validateKebabCase('hello world')).toFailWith(/kebab-case format/i);
  });

  test('should fail for special characters', () => {
    expect(validateKebabCase('hello_world')).toFailWith(/kebab-case format/i);
    expect(validateKebabCase('hello@world')).toFailWith(/kebab-case format/i);
  });

  test('should fail for leading/trailing hyphens', () => {
    expect(validateKebabCase('-hello')).toFailWith(/kebab-case format/i);
    expect(validateKebabCase('hello-')).toFailWith(/kebab-case format/i);
  });

  test('should fail for consecutive hyphens', () => {
    expect(validateKebabCase('hello--world')).toFailWith(/kebab-case format/i);
  });
});

describe('nameToBaseId', () => {
  test('should convert name to base ID', () => {
    expect(nameToBaseId('Hello World')).toSucceedWith('hello-world');
    expect(nameToBaseId('Test Ingredient')).toSucceedWith('test-ingredient');
  });

  test('should handle special characters', () => {
    expect(nameToBaseId('Hello & World')).toSucceedWith('hello-world');
    expect(nameToBaseId('Test@123')).toSucceedWith('test-123');
  });

  test('should fail for empty name', () => {
    expect(nameToBaseId('')).toFailWith(/cannot be empty/i);
    expect(nameToBaseId('   ')).toFailWith(/cannot be empty/i);
  });

  test('should fail for name with no alphanumeric characters', () => {
    expect(nameToBaseId('---')).toFailWith(/at least one alphanumeric/i);
    expect(nameToBaseId('@@@')).toFailWith(/at least one alphanumeric/i);
  });

  test('should trim whitespace', () => {
    expect(nameToBaseId('  hello  ')).toSucceedWith('hello');
  });
});

describe('generateUniqueBaseId', () => {
  test('should return base ID if not in set', () => {
    const existingIds = new Set(['foo', 'bar']);
    expect(generateUniqueBaseId('baz', existingIds)).toSucceedWith('baz');
  });

  test('should append counter if base ID exists', () => {
    const existingIds = new Set(['hello', 'world']);
    expect(generateUniqueBaseId('hello', existingIds)).toSucceedWith('hello-2');
  });

  test('should increment counter until unique', () => {
    const existingIds = new Set(['hello', 'hello-2', 'hello-3']);
    expect(generateUniqueBaseId('hello', existingIds)).toSucceedWith('hello-4');
  });

  test('should work with array input', () => {
    const existingIds = ['foo', 'bar'];
    expect(generateUniqueBaseId('baz', existingIds)).toSucceedWith('baz');
  });

  test('should work with array containing duplicates', () => {
    const existingIds = ['hello', 'hello-2'];
    expect(generateUniqueBaseId('hello', existingIds)).toSucceedWith('hello-3');
  });

  test('should fail after max attempts', () => {
    const existingIds = new Set(['hello', 'hello-2', 'hello-3']);
    expect(generateUniqueBaseId('hello', existingIds, 2)).toFailWith(/could not generate.*after 2 attempts/i);
  });

  test('should handle large counter values', () => {
    const ids = ['test'];
    for (let i = 2; i <= 100; i++) {
      ids.push(`test-${i}`);
    }
    const existingIds = new Set(ids);
    expect(generateUniqueBaseId('test', existingIds)).toSucceedWith('test-101');
  });
});

describe('generateUniqueBaseIdFromName', () => {
  test('should generate unique base ID from name', () => {
    const existingIds = new Set(['foo', 'bar']);
    expect(generateUniqueBaseIdFromName('Hello World', existingIds)).toSucceedWith('hello-world');
  });

  test('should append counter if name collision', () => {
    const existingIds = new Set(['hello-world']);
    expect(generateUniqueBaseIdFromName('Hello World', existingIds)).toSucceedWith('hello-world-2');
  });

  test('should fail for empty name', () => {
    expect(generateUniqueBaseIdFromName('', new Set())).toFailWith(/cannot be empty/i);
  });

  test('should fail for invalid name', () => {
    expect(generateUniqueBaseIdFromName('---', new Set())).toFailWith(/at least one alphanumeric/i);
  });

  test('should work with custom max attempts', () => {
    const existingIds = new Set(['test', 'test-2', 'test-3']);
    expect(generateUniqueBaseIdFromName('Test', existingIds, 2)).toFailWith(/after 2 attempts/i);
  });
});

describe('validateNonEmptyString', () => {
  test('should succeed for non-empty string', () => {
    expect(validateNonEmptyString('hello', 'name')).toSucceed();
    expect(validateNonEmptyString('a', 'name')).toSucceed();
    expect(validateNonEmptyString('  hello  ', 'name')).toSucceed();
  });

  test('should fail for empty string', () => {
    expect(validateNonEmptyString('', 'name')).toFailWith(/name cannot be empty/i);
    expect(validateNonEmptyString('   ', 'name')).toFailWith(/name cannot be empty/i);
  });

  test('should use field name in error message', () => {
    expect(validateNonEmptyString('', 'description')).toFailWith(/description cannot be empty/i);
  });
});

describe('validateStringLength', () => {
  test('should succeed for string within bounds', () => {
    expect(validateStringLength('hello', 'name', { minLength: 3, maxLength: 10 })).toSucceed();
  });

  test('should succeed for exact min length', () => {
    expect(validateStringLength('abc', 'name', { minLength: 3 })).toSucceed();
  });

  test('should succeed for exact max length', () => {
    expect(validateStringLength('hello', 'name', { maxLength: 5 })).toSucceed();
  });

  test('should fail for string too short', () => {
    expect(validateStringLength('ab', 'name', { minLength: 3 })).toFailWith(/at least 3 characters/i);
  });

  test('should fail for string too long', () => {
    expect(validateStringLength('hello world', 'name', { maxLength: 5 })).toFailWith(/at most 5 characters/i);
  });

  test('should validate only minLength', () => {
    expect(validateStringLength('hello', 'name', { minLength: 3 })).toSucceed();
    expect(validateStringLength('hi', 'name', { minLength: 3 })).toFailWith(/at least 3/i);
  });

  test('should validate only maxLength', () => {
    expect(validateStringLength('hello', 'name', { maxLength: 10 })).toSucceed();
    expect(validateStringLength('this is too long', 'name', { maxLength: 10 })).toFailWith(/at most 10/i);
  });
});

describe('validatePositiveNumber', () => {
  test('should succeed for positive numbers', () => {
    expect(validatePositiveNumber(1, 'count')).toSucceed();
    expect(validatePositiveNumber(100, 'count')).toSucceed();
    expect(validatePositiveNumber(0.5, 'count')).toSucceed();
  });

  test('should succeed for zero', () => {
    expect(validatePositiveNumber(0, 'count')).toSucceed();
  });

  test('should fail for negative numbers', () => {
    expect(validatePositiveNumber(-1, 'count')).toFailWith(/count must be positive/i);
    expect(validatePositiveNumber(-0.5, 'count')).toFailWith(/count must be positive/i);
  });

  test('should fail for non-numbers', () => {
    expect(validatePositiveNumber('5', 'count')).toFailWith(/count must be a number/i);
    expect(validatePositiveNumber(null, 'count')).toFailWith(/count must be a number/i);
  });

  test('should fail for NaN', () => {
    expect(validatePositiveNumber(NaN, 'count')).toFailWith(/count must be a number/i);
  });
});

describe('validateNumberRange', () => {
  test('should succeed for number in range', () => {
    expect(validateNumberRange(5, 'value', 0, 10)).toSucceed();
    expect(validateNumberRange(0, 'value', 0, 10)).toSucceed();
    expect(validateNumberRange(10, 'value', 0, 10)).toSucceed();
  });

  test('should fail for number below range', () => {
    expect(validateNumberRange(-1, 'value', 0, 10)).toFailWith(/value must be between 0 and 10/i);
  });

  test('should fail for number above range', () => {
    expect(validateNumberRange(11, 'value', 0, 10)).toFailWith(/value must be between 0 and 10/i);
  });

  test('should fail for non-numbers', () => {
    expect(validateNumberRange('5', 'value', 0, 10)).toFailWith(/value must be a number/i);
  });

  test('should fail for NaN', () => {
    expect(validateNumberRange(NaN, 'value', 0, 10)).toFailWith(/value must be a number/i);
  });

  test('should handle negative ranges', () => {
    expect(validateNumberRange(-5, 'value', -10, 0)).toSucceed();
    expect(validateNumberRange(-11, 'value', -10, 0)).toFailWith(/between -10 and 0/i);
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
    expect(baseIdExists('foo', ids)).toBe(true);
    expect(baseIdExists('bar', ids)).toBe(true);
  });

  test('should return false for non-existing ID in Set', () => {
    const ids = new Set(['foo', 'bar']);
    expect(baseIdExists('baz', ids)).toBe(false);
  });

  test('should return true for existing ID in Array', () => {
    const ids = ['foo', 'bar', 'baz'];
    expect(baseIdExists('foo', ids)).toBe(true);
  });

  test('should return false for non-existing ID in Array', () => {
    const ids = ['foo', 'bar'];
    expect(baseIdExists('baz', ids)).toBe(false);
  });

  test('should handle empty Set', () => {
    expect(baseIdExists('foo', new Set())).toBe(false);
  });

  test('should handle empty Array', () => {
    expect(baseIdExists('foo', [])).toBe(false);
  });
});

describe('validateUniqueBaseId', () => {
  test('should succeed for unique ID', () => {
    const ids = new Set(['foo', 'bar']);
    expect(validateUniqueBaseId('baz', ids)).toSucceed();
  });

  test('should fail for duplicate ID', () => {
    const ids = new Set(['foo', 'bar']);
    expect(validateUniqueBaseId('foo', ids)).toFailWith(/foo.*already exists/i);
  });

  test('should work with array', () => {
    const ids = ['foo', 'bar'];
    expect(validateUniqueBaseId('baz', ids)).toSucceed();
    expect(validateUniqueBaseId('foo', ids)).toFailWith(/already exists/i);
  });

  test('should use custom field name in error', () => {
    const ids = new Set(['foo']);
    expect(validateUniqueBaseId('foo', ids, 'customId')).toFailWith(/customid/i);
  });

  test('should use default field name', () => {
    const ids = new Set(['foo']);
    expect(validateUniqueBaseId('foo', ids)).toFailWith(/baseid/i);
  });
});
