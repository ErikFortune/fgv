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
import { Converters, fail, succeed } from '@fgv/ts-utils';
import { processOutput } from '../../../../packlets/output';
import { PromptRegistry } from '../../../../packlets/registry';
import type { IPromptDescriptor } from '../../../../packlets/types';
import type { ConverterId, PromptId, SlotName, ValidatorId } from '../../../../packlets/types';
import type { IPromptRegistry } from '../../../../packlets/registry';
import type { IOutputValidationContext } from '../../../../packlets/registry';

const testId = 'test-prompt' as unknown as PromptId;
const testConverterId = 'my-converter' as unknown as ConverterId;
const testValidatorId = 'my-validator' as unknown as ValidatorId;

function makeContext(): IOutputValidationContext {
  return {
    promptId: testId,
    substitutions: new Map<SlotName, import('../../../../packlets/types').IBindingTraceEntry>()
  };
}

function makeFreeTextDescriptor(): IPromptDescriptor {
  return {
    id: testId,
    title: 'Test',
    schemaVersion: '1',
    surface: 'chat',
    slots: [],
    output: { kind: 'free-text' }
  };
}

function makeJsonDescriptor(validationIds?: ValidatorId[]): IPromptDescriptor {
  return {
    id: testId,
    title: 'Test',
    schemaVersion: '1',
    surface: 'chat',
    slots: [],
    output: { kind: 'json', converterId: testConverterId },
    outputValidations: validationIds
  };
}

describe('processOutput', () => {
  describe('free-text output kind', () => {
    test('returns rawOutput as-is for free-text descriptor', () => {
      const registry = PromptRegistry.empty();
      const descriptor = makeFreeTextDescriptor();
      const rawOutput = 'Hello, world!';
      expect(processOutput<string>(rawOutput, descriptor, registry, makeContext())).toSucceedWith(rawOutput);
    });

    test('returns empty string as-is for free-text', () => {
      const registry = PromptRegistry.empty();
      const descriptor = makeFreeTextDescriptor();
      expect(processOutput<string>('', descriptor, registry, makeContext())).toSucceedWith('');
    });
  });

  describe('json output kind', () => {
    test('successfully extracts JSON from plain text, converts via registered converter', () => {
      const registry = PromptRegistry.empty();
      registry.converters
        .register(testConverterId, Converters.object<{ name: string }>({ name: Converters.string }))
        .orThrow();

      const descriptor = makeJsonDescriptor();
      const rawOutput = '{"name":"Alice"}';
      expect(
        processOutput<{ name: string }>(rawOutput, descriptor, registry, makeContext())
      ).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('Alice');
      });
    });

    test('strips markdown fences before parsing', () => {
      const registry = PromptRegistry.empty();
      registry.converters
        .register(testConverterId, Converters.object<{ value: number }>({ value: Converters.number }))
        .orThrow();

      const descriptor = makeJsonDescriptor();
      const rawOutput = '```json\n{"value":42}\n```';
      expect(
        processOutput<{ value: number }>(rawOutput, descriptor, registry, makeContext())
      ).toSucceedAndSatisfy((result) => {
        expect(result.value).toBe(42);
      });
    });

    test('fails when JSON text cannot be extracted (extractJsonText failure)', () => {
      const registry = PromptRegistry.empty();
      registry.converters.register(testConverterId, Converters.string).orThrow();

      const descriptor = makeJsonDescriptor();
      // A string with no JSON-shaped content at all causes extractJsonText to fail
      const rawOutput = 'not valid json at all - no braces or brackets';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFailWith(/extractJsonText/i);
    });

    test('fails when JSON parse fails on malformed JSON', () => {
      const registry = PromptRegistry.empty();
      registry.converters.register(testConverterId, Converters.string).orThrow();

      const descriptor = makeJsonDescriptor();
      // Use balanced braces but invalid JSON content: extractJsonText succeeds but JSON.parse fails
      const rawOutput = '{bad: json, no quotes}';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFailWith(/JSON\.parse/i);
    });

    test('fails when converter is not registered', () => {
      const registry = PromptRegistry.empty();
      // Do NOT register the converter

      const descriptor = makeJsonDescriptor();
      const rawOutput = '{"name":"test"}';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFailWith(/converter/i);
    });

    test('fails when converter rejects the parsed value', () => {
      const registry = PromptRegistry.empty();
      // Register a converter that always fails
      const alwaysFailConverter = Converters.generic<{ name: string }>(() =>
        fail('value rejected by converter')
      );
      registry.converters.register(testConverterId, alwaysFailConverter).orThrow();

      const descriptor = makeJsonDescriptor();
      const rawOutput = '{"name":"Alice"}';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFailWith(/convert/i);
    });

    test('succeeds with registered validators that pass', () => {
      const registry = PromptRegistry.empty();
      registry.converters
        .register(testConverterId, Converters.object<{ val: string }>({ val: Converters.string }))
        .orThrow();
      registry.outputValidations
        .register(testValidatorId, {
          validate: (output) => succeed(output)
        })
        .orThrow();

      const descriptor = makeJsonDescriptor([testValidatorId]);
      const rawOutput = '{"val":"ok"}';
      expect(
        processOutput<{ val: string }>(rawOutput, descriptor, registry, makeContext())
      ).toSucceedAndSatisfy((result) => {
        expect(result.val).toBe('ok');
      });
    });

    test('fails when a registered validator rejects the output', () => {
      const registry = PromptRegistry.empty();
      registry.converters
        .register(testConverterId, Converters.object<{ val: string }>({ val: Converters.string }))
        .orThrow();
      registry.outputValidations
        .register(testValidatorId, {
          validate: () => fail('validation failed by design')
        })
        .orThrow();

      const descriptor = makeJsonDescriptor([testValidatorId]);
      const rawOutput = '{"val":"bad"}';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFailWith(/validator.*failed/i);
    });

    test('fails when a validator id is not in the registry', () => {
      const registry = PromptRegistry.empty();
      registry.converters
        .register(testConverterId, Converters.object<{ val: string }>({ val: Converters.string }))
        .orThrow();
      // Do NOT register the validator

      const descriptor = makeJsonDescriptor([testValidatorId]);
      const rawOutput = '{"val":"x"}';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFailWith(/validator/i);
    });

    test('runs validators in order and stops on first failure', () => {
      const secondValidatorId = 'second-validator' as unknown as ValidatorId;
      const calls: string[] = [];

      const registry = PromptRegistry.empty();
      registry.converters
        .register(testConverterId, Converters.object<{ val: string }>({ val: Converters.string }))
        .orThrow();
      registry.outputValidations
        .register(testValidatorId, {
          validate: (output) => {
            calls.push('first');
            return fail('first validator failed');
          }
        })
        .orThrow();
      registry.outputValidations
        .register(secondValidatorId, {
          validate: (output) => {
            calls.push('second');
            return succeed(output);
          }
        })
        .orThrow();

      const descriptor = makeJsonDescriptor([testValidatorId, secondValidatorId]);
      const rawOutput = '{"val":"test"}';
      expect(processOutput(rawOutput, descriptor, registry, makeContext())).toFail();
      // Second validator should not have been called
      expect(calls).toEqual(['first']);
    });

    test('uses registry from IPromptRegistry interface (not just PromptRegistry class)', () => {
      // Test that any conforming IPromptRegistry works
      const mockConverterRegistry: IPromptRegistry['converters'] = {
        register: () => fail('not implemented'),
        get: <T>() => succeed(Converters.string as unknown as import('@fgv/ts-utils').Converter<T>),
        has: () => true
      };
      const mockRegistry: IPromptRegistry = {
        converters: mockConverterRegistry,
        slotKinds: {
          register: () => fail('not implemented'),
          get: () => fail('not implemented'),
          has: () => false
        },
        outputValidations: {
          register: () => fail('not implemented'),
          get: () => fail('not implemented'),
          has: () => false
        }
      };

      const descriptor = makeJsonDescriptor();
      const rawOutput = '"hello"';
      // The converter returns a string; the result is 'hello'
      expect(processOutput<string>(rawOutput, descriptor, mockRegistry, makeContext())).toSucceedWith(
        'hello'
      );
    });
  });
});
