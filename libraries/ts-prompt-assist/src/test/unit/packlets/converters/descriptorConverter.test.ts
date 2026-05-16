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
import { storedPromptRecordConverter } from '../../../../packlets/converters/descriptorConverter';
import type { PromptId, ScopeKey } from '../../../../packlets/types';

const testScope = 'global' as unknown as ScopeKey;
const testId = 'greet' as unknown as PromptId;

/** Minimal valid stored prompt record payload (as YAML-parsed object). */
function makeValidRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'greet',
    title: 'Greeting Prompt',
    schemaVersion: '1',
    surface: 'chat',
    slots: [
      {
        name: 'name',
        description: 'The name to greet'
      }
    ],
    output: { kind: 'free-text' },
    candidates: [{ conditions: {}, body: 'Hello, {{{name}}}!' }],
    ...overrides
  };
}

describe('storedPromptRecordConverter', () => {
  const converter = storedPromptRecordConverter(testScope, testId);

  describe('success cases', () => {
    test('converts a minimal valid record', () => {
      expect(converter.convert(makeValidRecord())).toSucceedAndSatisfy((record) => {
        expect(record.scope).toBe(testScope);
        expect(record.id).toBe(testId);
        expect(record.descriptor.id).toBe('greet');
        expect(record.descriptor.title).toBe('Greeting Prompt');
        expect(record.candidates).toHaveLength(1);
        expect(record.candidates[0].body).toBe('Hello, {{{name}}}!');
        expect(record.candidates[0].conditions).toEqual({});
      });
    });

    test('converts a record with json output contract', () => {
      const payload = makeValidRecord({
        id: 'greet',
        output: { kind: 'json', converterId: 'my-converter' },
        candidates: [{ conditions: {}, body: 'Output: {{{value}}}' }]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.descriptor.output.kind).toBe('json');
      });
    });

    test('converts a record with isPartial candidate', () => {
      const payload = makeValidRecord({
        candidates: [
          { conditions: {}, body: 'Base: {{{name}}}', isPartial: true },
          { conditions: {}, body: 'End' }
        ]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.candidates).toHaveLength(2);
        expect(record.candidates[0].isPartial).toBe(true);
        expect(record.candidates[1].isPartial).toBeUndefined();
      });
    });

    test('converts a record with optional slot fields', () => {
      const payload = makeValidRecord({
        slots: [
          {
            name: 'name',
            description: 'The name',
            required: false,
            maxLength: 100,
            source: 'user',
            writableBy: 'any-scope',
            allowedDirectives: ['prose'],
            kind: 'string'
          }
        ]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        const slot = record.descriptor.slots[0];
        expect(slot.required).toBe(false);
        expect(slot.maxLength).toBe(100);
        expect(slot.source).toBe('user');
      });
    });

    test('converts a record with qualifier metadata', () => {
      const payload = makeValidRecord({
        qualifiers: {
          required: ['language'],
          expected: [{ name: 'region', description: 'Region', suggestedValues: ['US'] }],
          disallowed: ['debug']
        }
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.descriptor.qualifiers?.required).toContain('language');
        expect(record.descriptor.qualifiers?.disallowed).toContain('debug');
      });
    });

    test('converts a record with join policy', () => {
      const payload = makeValidRecord({
        join: {
          separator: '\n---\n',
          order: 'specificity-descending',
          trimTrailingWhitespace: false
        }
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.descriptor.join?.separator).toBe('\n---\n');
        expect(record.descriptor.join?.order).toBe('specificity-descending');
      });
    });

    test('converts a record with safeguard overrides', () => {
      const payload = makeValidRecord({
        safeguards: { defaultMaxLength: 512, skipInjectionScreening: true }
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.descriptor.safeguards?.defaultMaxLength).toBe(512);
      });
    });

    test('converts a record with outputValidations', () => {
      const payload = makeValidRecord({
        output: { kind: 'json', converterId: 'my-conv' },
        outputValidations: ['validate-schema', 'validate-length'],
        candidates: [{ conditions: {}, body: 'Data: {{{value}}}' }]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.descriptor.outputValidations).toContain('validate-schema');
      });
    });

    test('converts a record with examples', () => {
      const payload = makeValidRecord({
        examples: [
          {
            conditions: { language: 'en' },
            pairs: [{ input: { name: 'Alice' }, output: 'Hello, Alice!' }]
          }
        ]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.descriptor.examples).toHaveLength(1);
      });
    });

    test('converts a record with a literal defaultBinding on a slot', () => {
      const payload = makeValidRecord({
        slots: [
          {
            name: 'name',
            description: 'The name',
            defaultBinding: { kind: 'literal', value: 'World', directive: 'prose' }
          }
        ]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        const slot = record.descriptor.slots[0];
        expect(slot.defaultBinding?.kind).toBe('literal');
      });
    });

    test('converts a record with conditions in candidates (record form)', () => {
      const payload = makeValidRecord({
        candidates: [
          { conditions: { language: 'en' }, body: 'Hello, {{{name}}}!', isPartial: true },
          { conditions: {}, body: 'Greetings, {{{name}}}!' }
        ]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.candidates).toHaveLength(2);
      });
    });

    test('converts a candidate with no conditions field (defaults to empty object)', () => {
      const payload = makeValidRecord({
        candidates: [{ body: 'Hello, {{{name}}}!' }]
      });
      expect(converter.convert(payload)).toSucceedAndSatisfy((record) => {
        expect(record.candidates[0].conditions).toEqual({});
      });
    });
  });

  describe('failure cases', () => {
    test('fails when id field is missing', () => {
      const payload = makeValidRecord({ id: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when title field is missing', () => {
      const payload = makeValidRecord({ title: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when schemaVersion is missing', () => {
      const payload = makeValidRecord({ schemaVersion: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when schemaVersion is wrong value', () => {
      const payload = makeValidRecord({ schemaVersion: '2' });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when surface field is missing', () => {
      const payload = makeValidRecord({ surface: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when slots field is missing', () => {
      const payload = makeValidRecord({ slots: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when output field is missing', () => {
      const payload = makeValidRecord({ output: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when candidates field is missing', () => {
      const payload = makeValidRecord({ candidates: undefined });
      expect(converter.convert(payload)).toFailWith(/stored prompt record/i);
    });

    test('fails when descriptor id does not match expected id', () => {
      const wrongIdConverter = storedPromptRecordConverter(testScope, 'other-id' as unknown as PromptId);
      const payload = makeValidRecord();
      expect(wrongIdConverter.convert(payload)).toFailWith(/does not match/i);
    });

    test('fails when body uses double-brace tokens', () => {
      const payload = makeValidRecord({
        candidates: [{ conditions: {}, body: 'Hello, {{name}}!' }]
      });
      expect(converter.convert(payload)).toFailWith(/double-brace/i);
    });

    test('fails when candidate body has invalid Mustache syntax', () => {
      const payload = makeValidRecord({
        candidates: [{ conditions: {}, body: 'Hello {{#unclosed}} world' }]
      });
      expect(converter.convert(payload)).toFailWith(/invalid Mustache body/i);
    });

    test('fails when candidate body is missing', () => {
      const payload = makeValidRecord({
        candidates: [{ conditions: {}, body: undefined }]
      });
      expect(converter.convert(payload)).toFailWith(/missing or invalid.*body/i);
    });

    test('fails when candidate body is not a string', () => {
      const payload = makeValidRecord({
        candidates: [{ conditions: {}, body: 123 }]
      });
      expect(converter.convert(payload)).toFailWith(/missing or invalid.*body/i);
    });

    test('fails when input is null', () => {
      expect(converter.convert(null)).toFail();
    });

    test('fails when input is not an object', () => {
      expect(converter.convert('not an object')).toFail();
    });

    test('fails when output has wrong discriminator', () => {
      const payload = makeValidRecord({ output: { kind: 'xml' } });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });

    test('fails when json output is missing converterId', () => {
      const payload = makeValidRecord({ output: { kind: 'json' } });
      expect(converter.convert(payload)).toFailWith(/stored prompt descriptor/i);
    });
  });
});
