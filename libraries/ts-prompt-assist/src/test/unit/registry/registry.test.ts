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
import { Converters, succeed, fail } from '@fgv/ts-utils';
import {
  PromptRegistry,
  PromptConverterRegistry,
  PromptSlotKindRegistry,
  PromptOutputValidationRegistry
} from '../../../packlets/registry';
import type { ConverterId, ValidatorId } from '../../../packlets/types';

const testConverterId = 'my-converter' as unknown as ConverterId;
const testValidatorId = 'my-validator' as unknown as ValidatorId;

describe('PromptRegistry', () => {
  describe('create', () => {
    test('creates an empty registry successfully', () => {
      expect(PromptRegistry.create()).toSucceed();
    });

    test('created registry has empty converters', () => {
      const registry = PromptRegistry.create().orThrow();
      expect(registry.converters.has(testConverterId)).toBe(false);
    });
  });

  describe('empty()', () => {
    test('returns an empty PromptRegistry instance', () => {
      const registry = PromptRegistry.empty();
      expect(registry).toBeInstanceOf(PromptRegistry);
      expect(registry.converters.has(testConverterId)).toBe(false);
      expect(registry.slotKinds.has('string')).toBe(false);
      expect(registry.outputValidations.has(testValidatorId)).toBe(false);
    });
  });
});

describe('PromptConverterRegistry', () => {
  let registry: PromptConverterRegistry;

  beforeEach(() => {
    registry = new PromptConverterRegistry();
  });

  describe('register', () => {
    test('registers a converter successfully', () => {
      expect(registry.register(testConverterId, Converters.string)).toSucceedWith(testConverterId);
    });

    test('fails when registering a converter with an already-used id', () => {
      registry.register(testConverterId, Converters.string).orThrow();
      expect(registry.register(testConverterId, Converters.number)).toFailWith(/already registered/i);
    });
  });

  describe('get', () => {
    test('returns the registered converter', () => {
      registry.register(testConverterId, Converters.string).orThrow();
      expect(registry.get(testConverterId)).toSucceedAndSatisfy((converter) => {
        expect(converter).toBeDefined();
        expect(converter.convert('hello')).toSucceedWith('hello');
      });
    });

    test('fails when converter is not registered', () => {
      expect(registry.get(testConverterId)).toFailWith(/not registered/i);
    });
  });

  describe('has', () => {
    test('returns false when converter is not registered', () => {
      expect(registry.has(testConverterId)).toBe(false);
    });

    test('returns true after registration', () => {
      registry.register(testConverterId, Converters.string).orThrow();
      expect(registry.has(testConverterId)).toBe(true);
    });
  });
});

describe('PromptSlotKindRegistry', () => {
  let registry: PromptSlotKindRegistry;

  beforeEach(() => {
    registry = new PromptSlotKindRegistry();
  });

  const testSerializer = {
    serialize: (value: unknown) => succeed(String(value))
  };

  describe('register', () => {
    test('registers a serializer successfully', () => {
      expect(registry.register('json', testSerializer)).toSucceedWith('json');
    });

    test('fails when registering a serializer with an already-used kind', () => {
      registry.register('json', testSerializer).orThrow();
      expect(registry.register('json', testSerializer)).toFailWith(/already registered/i);
    });
  });

  describe('get', () => {
    test('returns the registered serializer', () => {
      registry.register('json', testSerializer).orThrow();
      expect(registry.get('json')).toSucceedAndSatisfy((serializer) => {
        expect(serializer).toBeDefined();
        expect(serializer.serialize({ a: 1 })).toSucceed();
      });
    });

    test('fails when serializer is not registered', () => {
      expect(registry.get('unknown-kind')).toFailWith(/not registered/i);
    });
  });

  describe('has', () => {
    test('returns false when kind is not registered', () => {
      expect(registry.has('json')).toBe(false);
    });

    test('returns true after registration', () => {
      registry.register('json', testSerializer).orThrow();
      expect(registry.has('json')).toBe(true);
    });
  });
});

describe('PromptOutputValidationRegistry', () => {
  let registry: PromptOutputValidationRegistry;

  beforeEach(() => {
    registry = new PromptOutputValidationRegistry();
  });

  const passingValidator = {
    validate: (output: unknown) => succeed(output)
  };

  const failingValidator = {
    validate: () => fail('always fails')
  };

  describe('register', () => {
    test('registers a validator successfully', () => {
      expect(registry.register(testValidatorId, passingValidator)).toSucceedWith(testValidatorId);
    });

    test('fails when registering with an already-used id', () => {
      registry.register(testValidatorId, passingValidator).orThrow();
      expect(registry.register(testValidatorId, failingValidator)).toFailWith(/already registered/i);
    });
  });

  describe('get', () => {
    test('returns the registered validator', () => {
      registry.register(testValidatorId, passingValidator).orThrow();
      expect(registry.get(testValidatorId)).toSucceedAndSatisfy((validator) => {
        expect(validator).toBeDefined();
        expect(
          validator.validate('anything', {
            promptId: 'p' as unknown as import('../../../packlets/types').PromptId,
            substitutions: new Map()
          })
        ).toSucceed();
      });
    });

    test('fails when validator is not registered', () => {
      expect(registry.get(testValidatorId)).toFailWith(/not registered/i);
    });
  });

  describe('has', () => {
    test('returns false when validator is not registered', () => {
      expect(registry.has(testValidatorId)).toBe(false);
    });

    test('returns true after registration', () => {
      registry.register(testValidatorId, passingValidator).orThrow();
      expect(registry.has(testValidatorId)).toBe(true);
    });
  });
});
