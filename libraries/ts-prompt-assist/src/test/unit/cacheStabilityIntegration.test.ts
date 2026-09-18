/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  IPromptStore,
  IPromptStoreFixtureSeed,
  IResolvedPrompt,
  IScopeSlotBindingsRecord,
  IStoredPromptRecord,
  PromptId,
  PromptLibrary,
  PromptStoreFixture,
  ScopeKey,
  SlotBinding,
  SlotName
} from '../../index';
import { QualifierTypes, Qualifiers } from '@fgv/ts-res';

const TEST_QUALIFIER_TYPES = QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [QualifierTypes.LiteralQualifierType.create({ name: 'lang' }).orThrow()]
}).orThrow();
const TEST_QUALIFIER_COLLECTOR = Qualifiers.QualifierCollector.create({
  qualifierTypes: TEST_QUALIFIER_TYPES,
  qualifiers: [{ name: 'lang', typeName: 'lang', defaultPriority: 1000 }]
}).orThrow();

const SCOPE = 'global' as unknown as ScopeKey;
const OTHER_SCOPE = 'tenant' as unknown as ScopeKey;
const PROMPT = 'p' as unknown as PromptId;
const TOPIC = 'topic' as unknown as SlotName;

async function buildLib(
  records: ReadonlyArray<IStoredPromptRecord>,
  bindings?: ReadonlyArray<IScopeSlotBindingsRecord>
): Promise<PromptLibrary> {
  const store: IPromptStore = (
    await PromptStoreFixture.build({ records: [...records], bindings } as IPromptStoreFixtureSeed)
  ).orThrow();
  return (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
}

function record(over: {
  readonly cacheStability?: 'frozen' | 'per-conversation' | 'per-request';
  readonly body: string;
}): IStoredPromptRecord {
  return {
    scope: SCOPE,
    id: PROMPT,
    descriptor: {
      id: PROMPT,
      title: 'p',
      schemaVersion: '1',
      surface: 'chat',
      slots: [
        {
          name: TOPIC,
          description: 'topic',
          ...(over.cacheStability === undefined ? {} : { cacheStability: over.cacheStability })
        }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: over.body }]
  };
}

function orderingFindings(r: IResolvedPrompt): ReadonlyArray<unknown> {
  return (r.composition?.cacheFindings ?? []).filter((f) => f.kind === 'cache-hostile-ordering');
}

function refutedFindings(r: IResolvedPrompt): ReadonlyArray<unknown> {
  return (r.composition?.cacheFindings ?? []).filter((f) => f.kind === 'stability-refuted');
}

describe('prompt-cache stability diagnostics — end-to-end wiring', () => {
  test('an authored IPromptSlot.cacheStability avoids a cache-hostile-ordering finding', async () => {
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}} static suffix' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(orderingFindings(r)).toEqual([]);
    });
  });

  test('an undeclared slot defaults to per-request and DOES trigger cache-hostile-ordering', async () => {
    const lib = await buildLib([record({ body: '{{{topic}}} static suffix' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(orderingFindings(r)).toHaveLength(1);
    });
  });

  test('a call-site cacheStability override wins over an authored claim, unconditionally', async () => {
    // Authored 'frozen' would avoid the ordering finding on its own (previous test); the
    // call-site override forces 'per-request' instead, proving precedence rather than mere
    // presence of an authored claim.
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}} static suffix' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {},
      cacheStability: new Map([[TOPIC, 'per-request']])
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(orderingFindings(r)).toHaveLength(1);
    });
  });

  test('a slot bound by >=2 scopes in the chain refutes an authored better-than-per-request claim', async () => {
    const bindings: ReadonlyArray<IScopeSlotBindingsRecord> = [
      {
        scope: SCOPE,
        bindings: new Map([[TOPIC, { kind: 'literal', value: 'a', directive: 'prose' } as SlotBinding]])
      },
      {
        scope: OTHER_SCOPE,
        bindings: new Map([[TOPIC, { kind: 'literal', value: 'b', directive: 'prose' } as SlotBinding]])
      }
    ];
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}}' })], bindings);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE, OTHER_SCOPE],
      qualifiers: {},
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      const refuted = refutedFindings(r) as ReadonlyArray<{
        slot?: SlotName;
        claimed?: { stability: string; origin: string };
        downgradedTo?: string;
      }>;
      expect(refuted).toHaveLength(1);
      expect(refuted[0].slot).toBe(TOPIC);
      expect(refuted[0].claimed).toEqual({ stability: 'frozen', origin: 'authored' });
      expect(refuted[0].downgradedTo).toBe('per-request');
    });
  });

  test('a single scope binding does not refute an authored better-than-per-request claim', async () => {
    const bindings: ReadonlyArray<IScopeSlotBindingsRecord> = [
      {
        scope: SCOPE,
        bindings: new Map([[TOPIC, { kind: 'literal', value: 'a', directive: 'prose' } as SlotBinding]])
      }
    ];
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}}' })], bindings);
    const result = await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {}, composition: {} });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(refutedFindings(r)).toEqual([]);
    });
  });

  test('cacheFindings is empty when the composition is unavailable', async () => {
    const lib = await buildLib([record({ cacheStability: 'frozen', body: 'a{{#topic}}b{{/topic}}c' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.composition!.unavailable).toBeDefined();
      expect(r.composition!.cacheFindings).toEqual([]);
    });
  });

  test('no cache diagnostics are computed when composition is not requested', async () => {
    const lib = await buildLib([record({ body: '{{{topic}}} static suffix' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      cacheStability: new Map([[TOPIC, 'frozen']])
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.composition).toBeUndefined();
    });
  });
});
