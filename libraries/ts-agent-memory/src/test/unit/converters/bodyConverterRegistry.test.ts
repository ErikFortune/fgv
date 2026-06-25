/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { BodyConverterRegistry } from '../../../packlets/converters';
import { Kind } from '../../../packlets/types';

const knowledgeKind: Kind = 'knowledge' as Kind;
const profileKind: Kind = 'profile' as Kind;

describe('BodyConverterRegistry', () => {
  let registry: BodyConverterRegistry;

  beforeEach(() => {
    registry = BodyConverterRegistry.create().orThrow();
  });

  test('create succeeds', () => {
    expect(BodyConverterRegistry.create()).toSucceed();
  });

  describe('register / has / convert', () => {
    test('registers a Converter and converts a matching body', () => {
      registry.register(knowledgeKind, Converters.string);
      expect(registry.has(knowledgeKind)).toBe(true);
      expect(registry.convert(knowledgeKind, 'a knowledge doc')).toSucceedWith('a knowledge doc');
    });

    test('a registered Converter rejects an invalid body', () => {
      registry.register(knowledgeKind, Converters.string);
      expect(registry.convert(knowledgeKind, 42)).toFail();
    });

    test('has returns false for an unregistered kind', () => {
      expect(registry.has(knowledgeKind)).toBe(false);
    });

    test('convert fails for an unregistered kind', () => {
      expect(registry.convert(knowledgeKind, 'x')).toFailWith(
        /no converter registered for kind 'knowledge'/i
      );
    });

    test('register replaces a prior registration for the same kind', () => {
      registry.register(knowledgeKind, Converters.string);
      registry.register(knowledgeKind, Converters.number);
      expect(registry.convert(knowledgeKind, 7)).toSucceedWith(7);
      expect(registry.convert(knowledgeKind, 'x')).toFail();
    });
  });

  describe('getConverter', () => {
    test('returns the registered converter', () => {
      registry.register(knowledgeKind, Converters.string);
      expect(registry.getConverter(knowledgeKind)).toSucceedAndSatisfy((converter) => {
        expect(converter.convert('hello')).toSucceedWith('hello');
      });
    });

    test('fails for an unregistered kind', () => {
      expect(registry.getConverter(knowledgeKind)).toFailWith(/no converter registered for kind/i);
    });
  });

  describe('registerSchema', () => {
    const profileSchema = JsonSchema.object({
      name: JsonSchema.string(),
      age: JsonSchema.integer()
    });

    test('registers a JsonSchema validator and validates a matching body', () => {
      registry.registerSchema(profileKind, profileSchema);
      expect(registry.has(profileKind)).toBe(true);
      expect(registry.convert(profileKind, { name: 'Ada', age: 36 })).toSucceedWith({
        name: 'Ada',
        age: 36
      });
    });

    test('a registered schema rejects an invalid body', () => {
      registry.registerSchema(profileKind, profileSchema);
      expect(registry.convert(profileKind, { name: 'Ada' })).toFail();
    });
  });
});
