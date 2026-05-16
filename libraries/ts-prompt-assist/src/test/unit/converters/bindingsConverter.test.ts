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
import { scopeSlotBindingsRecordConverter } from '../../../packlets/converters';
import type { ScopeKey } from '../../../packlets/types';

const testScope = 'global' as unknown as ScopeKey;

describe('scopeSlotBindingsRecordConverter', () => {
  const converter = scopeSlotBindingsRecordConverter(testScope);

  describe('success cases', () => {
    test('converts a record with a literal binding', () => {
      const input = {
        bindings: {
          name: { kind: 'literal', value: 'Alice', directive: 'prose' }
        }
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((record) => {
        expect(record.scope).toBe(testScope);
        expect(record.bindings.size).toBe(1);
        const binding = record.bindings.get('name' as unknown as import('../../../packlets/types').SlotName);
        expect(binding?.kind).toBe('literal');
        if (binding?.kind === 'literal') {
          expect(binding.value).toBe('Alice');
          expect(binding.directive).toBe('prose');
        }
      });
    });

    test('converts a record with a resource binding', () => {
      const input = {
        bindings: {
          system: { kind: 'resource', resourceId: 'res-123', directive: 'constraint' }
        }
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((record) => {
        const binding = record.bindings.get(
          'system' as unknown as import('../../../packlets/types').SlotName
        );
        expect(binding?.kind).toBe('resource');
      });
    });

    test('converts a record with multiple bindings', () => {
      const input = {
        bindings: {
          name: { kind: 'literal', value: 'Alice', directive: 'prose' },
          context: { kind: 'literal', value: 'test context', directive: 'hint' }
        }
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((record) => {
        expect(record.bindings.size).toBe(2);
      });
    });

    test('converts an empty bindings record', () => {
      const input = { bindings: {} };
      expect(converter.convert(input)).toSucceedAndSatisfy((record) => {
        expect(record.bindings.size).toBe(0);
        expect(record.scope).toBe(testScope);
      });
    });

    test('converts a literal binding with enforced flag', () => {
      const input = {
        bindings: {
          name: { kind: 'literal', value: 'Enforced', directive: 'constraint', enforced: true }
        }
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((record) => {
        const binding = record.bindings.get('name' as unknown as import('../../../packlets/types').SlotName);
        expect(binding?.enforced).toBe(true);
      });
    });

    test('converts a resource binding with optional fields', () => {
      const input = {
        bindings: {
          data: {
            kind: 'resource',
            resourceId: 'my-resource',
            directive: 'prose',
            qualifiers: { language: 'en' },
            enforced: false
          }
        }
      };
      expect(converter.convert(input)).toSucceedAndSatisfy((record) => {
        const binding = record.bindings.get('data' as unknown as import('../../../packlets/types').SlotName);
        expect(binding?.kind).toBe('resource');
        if (binding?.kind === 'resource') {
          expect(binding.qualifiers).toEqual({ language: 'en' });
        }
      });
    });
  });

  describe('failure cases', () => {
    test('fails when bindings field is missing', () => {
      expect(converter.convert({})).toFailWith(/scope bindings/i);
    });

    test('fails when input is null', () => {
      expect(converter.convert(null)).toFailWith(/scope bindings/i);
    });

    test('fails when input is not an object', () => {
      expect(converter.convert('not an object')).toFailWith(/scope bindings/i);
    });

    test('fails when a binding has an invalid kind', () => {
      const input = {
        bindings: {
          name: { kind: 'unknown-kind', value: 'Alice', directive: 'prose' }
        }
      };
      expect(converter.convert(input)).toFailWith(/scope bindings/i);
    });

    test('fails when a literal binding is missing directive', () => {
      const input = {
        bindings: {
          name: { kind: 'literal', value: 'Alice' }
        }
      };
      expect(converter.convert(input)).toFailWith(/scope bindings/i);
    });

    test('fails when a literal binding has invalid directive value', () => {
      const input = {
        bindings: {
          name: { kind: 'literal', value: 'Alice', directive: 'invalid-directive' }
        }
      };
      expect(converter.convert(input)).toFailWith(/scope bindings/i);
    });

    test('fails when a resource binding is missing resourceId', () => {
      const input = {
        bindings: {
          data: { kind: 'resource', directive: 'prose' }
        }
      };
      expect(converter.convert(input)).toFailWith(/scope bindings/i);
    });
  });

  describe('scope assignment', () => {
    test('assigns the scope from the constructor parameter', () => {
      const customScope = 'tenant-abc' as unknown as ScopeKey;
      const customConverter = scopeSlotBindingsRecordConverter(customScope);
      const input = { bindings: {} };
      expect(customConverter.convert(input)).toSucceedAndSatisfy((record) => {
        expect(record.scope).toBe(customScope);
      });
    });
  });
});
