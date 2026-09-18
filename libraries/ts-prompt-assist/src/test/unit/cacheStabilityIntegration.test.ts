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
  ResourceId,
  ScopeKey,
  SlotBinding,
  SlotName,
  toCacheRequest
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

const INNER_PROMPT = 'inner' as unknown as PromptId;

function resourceBoundOuterRecord(
  cacheStability: 'frozen' | 'per-conversation' | 'per-request'
): IStoredPromptRecord {
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
          cacheStability,
          defaultBinding: {
            kind: 'resource',
            resourceId: INNER_PROMPT as unknown as ResourceId,
            directive: 'prose'
          } as SlotBinding
        }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: '{{{topic}}}' }]
  };
}

function innerRecord(): IStoredPromptRecord {
  return {
    scope: SCOPE,
    id: INNER_PROMPT,
    descriptor: {
      id: INNER_PROMPT,
      title: 'inner',
      schemaVersion: '1',
      surface: 'chat',
      slots: [],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: 'everyone' }]
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

  test('a slot with no declared cacheStability defaults to per-request and DOES trigger cache-hostile-ordering', async () => {
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

  test('a repeated scope in the chain is not double-counted as a second binding', async () => {
    // Regression: `chain` is caller-supplied and not guaranteed distinct. Walking it naively would
    // count the one scope's binding twice, producing a false D1 refutation for a slot only one
    // scope actually binds.
    const bindings: ReadonlyArray<IScopeSlotBindingsRecord> = [
      {
        scope: SCOPE,
        bindings: new Map([[TOPIC, { kind: 'literal', value: 'a', directive: 'prose' } as SlotBinding]])
      }
    ];
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}}' })], bindings);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE, SCOPE],
      qualifiers: {},
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(refutedFindings(r)).toEqual([]);
    });
  });

  test('a non-adjacent duplicate scope keeps its most-specific position, not its least-specific one', async () => {
    // Regression: chain [A, B, A] must resolve as if A (its first, most-specific occurrence) were
    // the only entry, not process A's least-specific occurrence and let B win over it.
    const bindings: ReadonlyArray<IScopeSlotBindingsRecord> = [
      {
        scope: SCOPE,
        bindings: new Map([[TOPIC, { kind: 'literal', value: 'from-a', directive: 'prose' } as SlotBinding]])
      },
      {
        scope: OTHER_SCOPE,
        bindings: new Map([[TOPIC, { kind: 'literal', value: 'from-b', directive: 'prose' } as SlotBinding]])
      }
    ];
    const lib = await buildLib([record({ body: '{{{topic}}}' })], bindings);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE, OTHER_SCOPE, SCOPE],
      qualifiers: {},
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.slots.get(TOPIC)?.value).toBe('from-a');
      expect(r.slots.get(TOPIC)?.winningScope).toBe(SCOPE);
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

  test('a resource-bound slot claiming better than per-request is refuted end-to-end', async () => {
    const lib = await buildLib([resourceBoundOuterRecord('frozen'), innerRecord()]);
    const result = await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {}, composition: {} });
    expect(result).toSucceedAndSatisfy((r) => {
      const refuted = refutedFindings(r) as ReadonlyArray<{ slot?: SlotName; downgradedTo?: string }>;
      expect(refuted).toHaveLength(1);
      expect(refuted[0].slot).toBe(TOPIC);
      expect(refuted[0].downgradedTo).toBe('per-request');
    });
  });

  test('composition.cacheDiagnostics is forwarded end-to-end to produce a threshold finding', async () => {
    // Regression coverage for the analyzer-options wiring in PromptLibrary._buildComposition,
    // which no prior end-to-end case exercised (only direct analyzer-input tests did).
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}}' })]);
    const chars = (text: string): number => text.length;
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: { measure: chars, cacheDiagnostics: { minCacheablePrefixTokens: 1000 } }
    });
    expect(result).toSucceedAndSatisfy((r) => {
      const belowThreshold = (r.composition?.cacheFindings ?? []).filter((f) => f.kind === 'below-threshold');
      expect(belowThreshold).toHaveLength(1);
      expect(belowThreshold[0].detail).toMatch(/1000 token/);
    });
  });

  test('IPromptSection.effectiveStability is populated end-to-end, matching the diagnostics analysis', async () => {
    const lib = await buildLib([record({ cacheStability: 'frozen', body: '{{{topic}}} static suffix' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      const sections = r.composition!.sections;
      expect(sections.every((s) => s.effectiveStability !== undefined)).toBe(true);
      const slotSection = sections.find((s) => s.kind === 'slot');
      expect(slotSection?.effectiveStability).toBe('frozen');
      // No cache-hostile-ordering finding was produced for this resolve (asserted above by a
      // sibling test using the same fixture) precisely because both sections are 'frozen'.
      expect(sections.every((s) => s.effectiveStability === 'frozen')).toBe(true);
    });
  });

  test('toCacheRequest built from an end-to-end composition round-trips through AiAssist validation', async () => {
    // Authored 'per-request' on the slot (an explicit call-site override) followed by static
    // template text — a downward transition does not exist here (per-request -> frozen is
    // upward), so this composition intentionally exercises the zero-breakpoint, no-op path.
    const lib = await buildLib([record({ body: '{{{topic}}} static suffix' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(toCacheRequest(r.composition!)).toSucceedWith({});
    });
  });

  test('toCacheRequest built from a frozen-then-volatile composition emits a breakpoint at the transition', async () => {
    // No authored cacheStability on the slot: it defaults to 'per-request' (R-a), while the
    // preceding literal template text defaults to 'frozen' (D3) — a genuine downward transition.
    const lib = await buildLib([record({ body: 'prefix {{{topic}}}' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      const composition = r.composition!;
      const templateSection = composition.sections.find((s) => s.kind === 'template');
      const slotSection = composition.sections.find((s) => s.kind === 'slot');
      expect(templateSection?.effectiveStability).toBe('frozen');
      expect(slotSection?.effectiveStability).toBe('per-request');
      expect(toCacheRequest(composition)).toSucceedAndSatisfy((cache) => {
        expect(cache.systemBreakpoints).toEqual([slotSection!.start]);
      });
    });
  });

  test('toCacheRequest fails when the composition is unavailable', async () => {
    const lib = await buildLib([record({ cacheStability: 'frozen', body: 'a{{#topic}}b{{/topic}}c' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: 'x' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(toCacheRequest(r.composition!)).toFailWith(/unavailable/i);
    });
  });

  test('toCacheRequest succeeds, with no breakpoint, when a trailing unannotated slot resolves empty', async () => {
    // End-to-end regression for the pre-merge code-reviewer finding: a prompt ending in a dynamic
    // slot that happens to render empty this call must not turn an ordinary resolve into a hard
    // failure. No authored cacheStability on the slot: it defaults to 'per-request' (R-a), and the
    // preceding literal template text defaults to 'frozen' (D3) — a genuine downward transition
    // whose offset would coincide with the document's own length once the slot renders empty.
    const lib = await buildLib([record({ body: 'prefix {{{topic}}}' })]);
    const result = await lib.resolve({
      id: PROMPT,
      chain: [SCOPE],
      qualifiers: {},
      substitutions: { topic: '' },
      composition: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(toCacheRequest(r.composition!)).toSucceedWith({});
    });
  });
});
