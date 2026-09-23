/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Runtime as TsResRuntime } from '@fgv/ts-res';
import { analyzePromptCacheStability } from '../../packlets/resolve';
// `deriveCacheBreakpointOffsets` is `@internal` plumbing shared between `promptLibrary.ts` and
// `toCacheRequest.ts` — deliberately not re-exported through the packlet's public barrel (see
// `packlets/resolve/index.ts`), so tests reach it via the module directly.
// eslint-disable-next-line @rushstack/packlets/mechanics
import { deriveCacheBreakpointOffsets } from '../../packlets/resolve/cacheStabilityAnalysis';
import {
  AxisName,
  IBindingTraceEntry,
  ICandidateMatchTraceEntry,
  IPromptCacheFinding,
  IPromptCandidateRecord,
  IPromptQualifierMetadata,
  IPromptSection,
  IPromptSlot,
  IResourceBindingTraceEntry,
  PromptCacheStability,
  SlotName
} from '../../packlets/types';

const SLOT_A = 'slotA' as unknown as SlotName;
const SLOT_B = 'slotB' as unknown as SlotName;
const SLOT_C = 'slotC' as unknown as SlotName;

function slot(name: SlotName, cacheStability?: PromptCacheStability): IPromptSlot {
  return { name, description: 'test slot', ...(cacheStability === undefined ? {} : { cacheStability }) };
}

function bindingEntry(overrides: Partial<IBindingTraceEntry> = {}): IBindingTraceEntry {
  return { source: 'binding', directive: 'prose', value: 'x', wasEnforced: false, ...overrides };
}

function section(
  overrides: Partial<IPromptSection> & Pick<IPromptSection, 'kind' | 'start' | 'chars'>
): IPromptSection {
  return overrides;
}

function condition(): TsResRuntime.IConditionMatchResult {
  return {} as unknown as TsResRuntime.IConditionMatchResult;
}

function resourceBinding(slotName: SlotName): IResourceBindingTraceEntry {
  return { slot: slotName } as unknown as IResourceBindingTraceEntry;
}

function candidate(conditions: IPromptCandidateRecord['conditions']): IPromptCandidateRecord {
  return { conditions, body: 'body' };
}

function declaring(
  axes: ReadonlyArray<{ readonly name: string; readonly stability?: PromptCacheStability }>
): IPromptQualifierMetadata {
  return { expected: axes.map((axis) => ({ ...axis, name: axis.name as unknown as AxisName })) };
}

function match(candidateIndex: number, conditionCount: number = 1): ICandidateMatchTraceEntry {
  return {
    candidateIndex,
    matchType: 'match',
    conditions: Array.from({ length: conditionCount }, condition)
  };
}

function refutations(findings: ReadonlyArray<IPromptCacheFinding>): ReadonlyArray<IPromptCacheFinding> {
  return findings.filter((f) => f.kind === 'stability-refuted');
}

function findingKinds(findings: ReadonlyArray<IPromptCacheFinding>): string[] {
  return findings.map((f) => f.kind);
}

describe('analyzePromptCacheStability', () => {
  test('produces no findings for a wholly cacheable, well-ordered, above-threshold prefix', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 10, measured: 100 }),
      section({ kind: 'template', start: 10, chars: 10, measured: 100 })
    ];
    const findings = analyzePromptCacheStability({
      sections,
      mergedBindings: new Map(),
      candidateMatches: [],
      resourceBindingResolutions: [],
      slots: [],
      options: { minCacheablePrefixTokens: 50 }
    });
    expect(findings).toEqual([]);
  });

  describe('D1 — multi-scope binding refutation', () => {
    test('downgrades an authored claim when >=2 scopes bind the slot', () => {
      const mergedBindings = new Map([[SLOT_A, bindingEntry({ chainBindingCount: 2 })]]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'frozen')]
      });
      const refuted = findings.filter((f) => f.kind === 'stability-refuted');
      expect(refuted).toHaveLength(1);
      expect(refuted[0]).toMatchObject({
        kind: 'stability-refuted',
        slot: SLOT_A,
        claimed: { stability: 'frozen', origin: 'authored' },
        downgradedTo: 'per-request'
      });
    });

    test('downgrades a call-site override, which wins over an authored claim', () => {
      const mergedBindings = new Map([[SLOT_A, bindingEntry({ chainBindingCount: 3 })]]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation')],
        callSiteOverrides: new Map([[SLOT_A, 'frozen']])
      });
      const refuted = findings.filter((f) => f.kind === 'stability-refuted');
      expect(refuted).toHaveLength(1);
      expect(refuted[0].claimed).toEqual({ stability: 'frozen', origin: 'call-site' });
    });

    test('does not fire when only one scope binds the slot', () => {
      const mergedBindings = new Map([[SLOT_A, bindingEntry({ chainBindingCount: 1 })]]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'frozen')]
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });

    test('does not fire when the winning source is not a scope binding', () => {
      const mergedBindings = new Map([
        [SLOT_A, bindingEntry({ source: 'caller-sub', chainBindingCount: undefined })]
      ]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'frozen')]
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });

    test('does not fire for a claim of per-request regardless of binding count', () => {
      const mergedBindings = new Map([[SLOT_A, bindingEntry({ chainBindingCount: 5 })]]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-request')]
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });

    test('an undeclared slot defaults to per-request and is not checked at all', () => {
      const mergedBindings = new Map([[SLOT_A, bindingEntry({ chainBindingCount: 4 })]]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)]
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });

    test('downgrades a better-than-per-request claim on a resource-bound slot unconditionally', () => {
      // No scope-level binding at all (chainBindingCount N/A) — the refutation comes purely from
      // the slot being resource-bound, since this analysis does not recurse into the inner resolve.
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [resourceBinding(SLOT_A)],
        slots: [slot(SLOT_A, 'frozen')]
      });
      const refuted = findings.filter((f) => f.kind === 'stability-refuted');
      expect(refuted).toHaveLength(1);
      expect(refuted[0]).toMatchObject({
        kind: 'stability-refuted',
        slot: SLOT_A,
        claimed: { stability: 'frozen', origin: 'authored' },
        downgradedTo: 'per-request'
      });
    });

    test('does not fire for a resource-bound slot claiming per-request', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [resourceBinding(SLOT_A)],
        slots: [slot(SLOT_A, 'per-request')]
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });

    test('does not fire for an unrelated slot when a different slot is resource-bound', () => {
      const mergedBindings = new Map([[SLOT_B, bindingEntry({ chainBindingCount: 1 })]]);
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_B, start: 0, chars: 1 })],
        mergedBindings,
        candidateMatches: [],
        resourceBindingResolutions: [resourceBinding(SLOT_A)],
        slots: [slot(SLOT_B, 'frozen')]
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });
  });

  describe('D2 — conditional template refutation', () => {
    test('downgrades every template section when a candidate matched conditionally', () => {
      const candidateMatches: ICandidateMatchTraceEntry[] = [
        { candidateIndex: 0, matchType: 'match', conditions: [condition()] }
      ];
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches,
        resourceBindingResolutions: [],
        slots: []
      });
      const refuted = findings.filter((f) => f.kind === 'stability-refuted');
      expect(refuted).toHaveLength(1);
      expect(refuted[0]).toMatchObject({
        kind: 'stability-refuted',
        claimed: { stability: 'frozen', origin: 'derived' },
        downgradedTo: 'per-request'
      });
    });

    test('emits one finding per conditionally-matched candidate', () => {
      const candidateMatches: ICandidateMatchTraceEntry[] = [
        { candidateIndex: 0, matchType: 'match', conditions: [condition()] },
        { candidateIndex: 1, matchType: 'match', conditions: [condition(), condition()] }
      ];
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches,
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toHaveLength(2);
    });

    test('does not fire for matchAsDefault, even with a non-empty condition set', () => {
      const candidateMatches: ICandidateMatchTraceEntry[] = [
        { candidateIndex: 0, matchType: 'matchAsDefault', conditions: [condition()] }
      ];
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches,
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });

    test('downgrades a frozen slot claim body-wide even with no template section present', () => {
      // A conditional candidate makes the whole body unverified, not just its
      // literal 'template' text — a slot's presence/position inside that body
      // can change along with which candidate wins on a later resolve, so its
      // claim is refuted too, even though no 'template' section exists here.
      const candidateMatches: ICandidateMatchTraceEntry[] = [
        { candidateIndex: 0, matchType: 'match', conditions: [condition()] }
      ];
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings: new Map(),
        candidateMatches,
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'frozen')]
      });
      const refuted = findings.filter((f) => f.kind === 'stability-refuted');
      // One finding for the conditional candidate itself (D2), one for the
      // slot's now-refuted claim (D1's bodyConditional branch).
      expect(refuted).toHaveLength(2);
      expect(refuted).toContainEqual(
        expect.objectContaining({
          kind: 'stability-refuted',
          slot: SLOT_A,
          claimed: { stability: 'frozen', origin: 'authored' },
          downgradedTo: 'per-request'
        })
      );
    });

    test('does not touch an unclaimed slot when the body is conditional', () => {
      const candidateMatches: ICandidateMatchTraceEntry[] = [
        { candidateIndex: 0, matchType: 'match', conditions: [condition()] }
      ];
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings: new Map(),
        candidateMatches,
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)]
      });
      const refuted = findings.filter((f) => f.kind === 'stability-refuted');
      // Only the candidate-level D2 finding; an unclaimed slot has nothing to
      // refute (it was already 'per-request' by default, R-a).
      expect(refuted).toHaveLength(1);
      expect(refuted[0]).not.toHaveProperty('slot', SLOT_A);
    });

    test('does not fire when no candidate matched on a non-empty condition set', () => {
      const candidateMatches: ICandidateMatchTraceEntry[] = [
        { candidateIndex: 0, matchType: 'match', conditions: [] }
      ];
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches,
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });
  });

  describe('D2 — qualifier-declared stability (IExpectedQualifierAxis.stability)', () => {
    const TEMPLATE_THEN_SLOT: IPromptSection[] = [
      section({ kind: 'template', start: 0, chars: 5 }),
      section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 1 })
    ];

    describe('compatibility: an undeclared axis reproduces the pre-declaration refutations exactly', () => {
      // Each case is run twice — once with no attribution data at all (the pre-declaration input
      // shape) and once attributed to an axis that declares no stability — and both must produce
      // the same refutations, differing only in how `detail` explains them.
      const cases: ReadonlyArray<[string, IPromptQualifierMetadata | undefined]> = [
        ['no qualifier metadata', undefined],
        ['an expected axis with no stability', declaring([{ name: 'tone' }])],
        ['stability declared only on a different axis', declaring([{ name: 'lang', stability: 'frozen' }])]
      ];

      test.each(cases)('%s', (__name, qualifiers) => {
        const common = {
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map<SlotName, IBindingTraceEntry>(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')]
        };
        const unattributed = refutations(analyzePromptCacheStability(common));
        const attributed = refutations(
          analyzePromptCacheStability({ ...common, candidates: [candidate({ tone: 'formal' })], qualifiers })
        );

        const shape = (f: IPromptCacheFinding): unknown => ({
          slot: f.slot,
          claimed: f.claimed,
          downgradedTo: f.downgradedTo
        });
        expect(attributed.map(shape)).toEqual(unattributed.map(shape));
        expect(attributed.map(shape)).toEqual([
          {
            slot: undefined,
            claimed: { stability: 'frozen', origin: 'derived' },
            downgradedTo: 'per-request'
          },
          { slot: SLOT_A, claimed: { stability: 'frozen', origin: 'authored' }, downgradedTo: 'per-request' }
        ]);
        for (const finding of attributed) {
          expect(finding.detail).toMatch(/qualifier 'tone' \(no declared stability, so 'per-request'\)/);
        }
      });

      test('a call-site override is refuted by an undeclared axis, as before', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A)],
          callSiteOverrides: new Map([[SLOT_A, 'frozen']]),
          candidates: [candidate({ tone: 'formal' })]
        });
        expect(refutations(findings)).toContainEqual(
          expect.objectContaining({
            slot: SLOT_A,
            claimed: { stability: 'frozen', origin: 'call-site' },
            downgradedTo: 'per-request'
          })
        );
      });
    });

    describe("a 'frozen'-declared conditioning axis", () => {
      const qualifiers = declaring([{ name: 'tone', stability: 'frozen' }]);

      test('does not refute a template section — no finding, and the section stays frozen', () => {
        const findings = analyzePromptCacheStability({
          sections: [section({ kind: 'template', start: 0, chars: 5, measured: 100 })],
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [],
          candidates: [candidate({ tone: 'formal' })],
          qualifiers,
          options: { minCacheablePrefixTokens: 50 }
        });
        // A wholly cacheable, above-threshold prefix: only possible if the template stayed frozen.
        expect(findings).toEqual([]);
      });

      test('does not refute an authored frozen slot claim', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates: [candidate({ tone: 'formal' })],
          qualifiers
        });
        expect(refutations(findings)).toEqual([]);
        expect(findingKinds(findings)).not.toContain('cache-hostile-ordering');
      });

      test('does not refute a frozen call-site override', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A)],
          callSiteOverrides: new Map([[SLOT_A, 'frozen']]),
          candidates: [candidate({ tone: 'formal' })],
          qualifiers
        });
        expect(refutations(findings)).toEqual([]);
      });

      test('does not shield a slot from the other refutation checks', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map([[SLOT_A, bindingEntry({ chainBindingCount: 2 })]]),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates: [candidate({ tone: 'formal' })],
          qualifiers
        });
        expect(refutations(findings)).toEqual([
          expect.objectContaining({ slot: SLOT_A, downgradedTo: 'per-request' })
        ]);
        expect(refutations(findings)[0].detail).toMatch(/2 scopes/);
      });
    });

    describe("a 'per-conversation'-declared conditioning axis", () => {
      const qualifiers = declaring([{ name: 'persona', stability: 'per-conversation' }]);

      test('refutes a frozen claim down to per-conversation, naming the axis and its declaration', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates: [candidate({ persona: 'pirate' })],
          qualifiers
        });
        const refuted = refutations(findings);
        expect(refuted).toEqual([
          expect.objectContaining({
            claimed: { stability: 'frozen', origin: 'derived' },
            downgradedTo: 'per-conversation'
          }),
          expect.objectContaining({
            slot: SLOT_A,
            claimed: { stability: 'frozen', origin: 'authored' },
            downgradedTo: 'per-conversation'
          })
        ]);
        for (const finding of refuted) {
          expect(finding.detail).toMatch(/qualifier 'persona' \(declared 'per-conversation'\)/);
        }
      });

      test('does not refute a per-conversation slot claim', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'per-conversation')],
          candidates: [candidate({ persona: 'pirate' })],
          qualifiers
        });
        // Only the candidate-level finding against the template's derived 'frozen' default.
        expect(refutations(findings)).toEqual([
          expect.objectContaining({ downgradedTo: 'per-conversation' })
        ]);
        expect(refutations(findings)[0].slot).toBeUndefined();
        // Template and slot are both per-conversation now: one run, nothing hostile.
        expect(findingKinds(findings)).not.toContain('cache-hostile-ordering');
      });
    });

    test('names only the axes less stable than the claim when a candidate is conditioned on several', () => {
      const findings = analyzePromptCacheStability({
        sections: TEMPLATE_THEN_SLOT,
        mergedBindings: new Map(),
        candidateMatches: [match(0, 3)],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation')],
        candidates: [candidate({ lang: 'en', persona: 'pirate', tone: 'formal' })],
        qualifiers: declaring([
          { name: 'lang', stability: 'frozen' },
          { name: 'persona', stability: 'per-conversation' }
        ])
      });
      const refuted = refutations(findings);
      expect(refuted.map((f) => f.downgradedTo)).toEqual(['per-request', 'per-request']);
      // The template's 'frozen' default is refuted by both non-frozen axes...
      expect(refuted[0].detail).toMatch(/'persona' \(declared 'per-conversation'\), qualifier 'tone'/);
      expect(refuted[0].detail).not.toMatch(/'lang'/);
      // ...but a 'per-conversation' claim only by the axis less stable than that.
      expect(refuted[1].slot).toBe(SLOT_A);
      expect(refuted[1].detail).toMatch(/qualifier 'tone' \(no declared stability/);
      expect(refuted[1].detail).not.toMatch(/'persona'|'lang'/);
    });

    test('emits a finding only for the winning candidates whose conditioning is less than frozen', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches: [match(0), match(1)],
        resourceBindingResolutions: [],
        slots: [],
        candidates: [candidate({ lang: 'en' }), candidate({ tone: 'formal' })],
        qualifiers: declaring([{ name: 'lang', stability: 'frozen' }])
      });
      const refuted = refutations(findings);
      expect(refuted).toHaveLength(1);
      expect(refuted[0].detail).toMatch(/^candidate 1: .*qualifier 'tone'/);
    });

    test('still ignores a matchAsDefault candidate, whatever its axis is declared as', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches: [{ candidateIndex: 0, matchType: 'matchAsDefault', conditions: [condition()] }],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'frozen')],
        candidates: [candidate({ tone: 'formal' })],
        qualifiers: declaring([{ name: 'tone', stability: 'per-request' }])
      });
      expect(refutations(findings)).toEqual([]);
    });

    test('reads qualifier names from the array form of a condition set', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches: [match(0, 2)],
        resourceBindingResolutions: [],
        slots: [],
        candidates: [
          candidate([
            { qualifierName: 'lang', value: 'en' },
            { qualifierName: 'lang', value: 'fr', priority: 10 }
          ])
        ],
        qualifiers: declaring([{ name: 'lang', stability: 'per-conversation' }])
      });
      const refuted = refutations(findings);
      expect(refuted).toEqual([expect.objectContaining({ downgradedTo: 'per-conversation' })]);
      // A qualifier named twice is reported once.
      expect(refuted[0].detail.match(/'lang'/g)).toHaveLength(1);
    });

    test('reads qualifier names from the record-with-details form of a condition set', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5, measured: 100 })],
        mergedBindings: new Map(),
        candidateMatches: [match(0)],
        resourceBindingResolutions: [],
        slots: [],
        candidates: [candidate({ lang: { value: 'en', priority: 500 } })],
        qualifiers: declaring([{ name: 'lang', stability: 'frozen' }]),
        options: { minCacheablePrefixTokens: 50 }
      });
      expect(findings).toEqual([]);
    });

    test('an axis declared more than once takes the least stable declaration', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'template', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches: [match(0)],
        resourceBindingResolutions: [],
        slots: [],
        candidates: [candidate({ lang: 'en' })],
        qualifiers: declaring([
          { name: 'lang', stability: 'frozen' },
          { name: 'lang', stability: 'per-conversation' },
          { name: 'lang', stability: 'frozen' }
        ])
      });
      expect(refutations(findings)).toEqual([expect.objectContaining({ downgradedTo: 'per-conversation' })]);
    });

    describe('candidates that did not win this resolve', () => {
      const qualifiers = declaring([
        { name: 'lang', stability: 'frozen' },
        { name: 'persona', stability: 'per-conversation' }
      ]);

      test('a losing candidate on a volatile axis refutes a body whose winners are conditioned only on frozen axes', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates: [candidate({ lang: 'en' }), candidate({ lang: 'en', tone: 'formal' })],
          qualifiers
        });
        const refuted = refutations(findings);
        expect(refuted).toEqual([
          expect.objectContaining({
            claimed: { stability: 'frozen', origin: 'derived' },
            downgradedTo: 'per-request'
          }),
          expect.objectContaining({ slot: SLOT_A, downgradedTo: 'per-request' })
        ]);
        expect(refuted[0].detail).toMatch(/^candidate\(s\) 1: did not match this resolve/);
        expect(refuted[0].detail).toMatch(/qualifier 'tone' \(no declared stability/);
        // The frozen axis the losing candidate shares with the winner is not what refutes.
        expect(refuted[0].detail).not.toMatch(/'lang'/);
        expect(refuted[1].detail).toMatch(/qualifier 'tone'/);
      });

      test('a losing candidate lowers the body only to its own least stable axis', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'per-conversation')],
          candidates: [candidate({ lang: 'en' }), candidate({ persona: 'pirate' })],
          qualifiers
        });
        // Template default refuted to per-conversation; the per-conversation slot claim stands.
        expect(refutations(findings).map((f) => [f.slot, f.downgradedTo])).toEqual([
          [undefined, 'per-conversation']
        ]);
      });

      test('a losing candidate conditioned only on axes at least as stable as the winners changes nothing', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'per-conversation')],
          candidates: [candidate({ persona: 'pirate' }), candidate({ lang: 'fr' }), candidate({})],
          qualifiers
        });
        // Only the winner's own per-conversation finding; no competing-candidate finding.
        expect(refutations(findings).map((f) => [f.slot, f.downgradedTo])).toEqual([
          [undefined, 'per-conversation']
        ]);
        expect(refutations(findings)[0].detail).toMatch(/^candidate 0:/);
      });

      test('losing candidates are not consulted when no winner is conditional, as before', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0, 0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates: [candidate({}), candidate({ tone: 'formal' })],
          qualifiers
        });
        expect(refutations(findings)).toEqual([]);
      });

      test('an undeclared winning axis already puts the body at per-request, so no extra finding is added', () => {
        const common = {
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map<SlotName, IBindingTraceEntry>(),
          candidateMatches: [match(0)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')]
        };
        const withoutCompetitor = analyzePromptCacheStability({
          ...common,
          candidates: [candidate({ tone: 'formal' })]
        });
        const withCompetitor = analyzePromptCacheStability({
          ...common,
          candidates: [candidate({ tone: 'formal' }), candidate({ tone: 'casual', mood: 'grim' })]
        });
        expect(refutations(withCompetitor)).toEqual(refutations(withoutCompetitor));
      });
    });

    describe('a match whose conditioning axes cannot be determined is treated as per-request', () => {
      const qualifiers = declaring([{ name: 'lang', stability: 'frozen' }]);
      const cases: ReadonlyArray<[string, ReadonlyArray<IPromptCandidateRecord> | undefined]> = [
        ['no candidates supplied', undefined],
        ['a candidate index past the end of the candidates', [candidate({ lang: 'en' })]],
        ['a declaration naming no qualifier', [candidate({ lang: 'en' }), candidate({})]],
        [
          'a record declaration whose only key is undefined',
          [candidate({ lang: 'en' }), candidate({ lang: undefined })]
        ]
      ];

      test.each(cases)('%s', (__name, candidates) => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(1)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates,
          qualifiers
        });
        const refuted = refutations(findings);
        expect(refuted.map((f) => f.downgradedTo)).toEqual(['per-request', 'per-request']);
        for (const finding of refuted) {
          expect(finding.detail).toMatch(/candidate\(s\) 1, whose qualifiers are not known to this check/);
        }
      });

      test('an unattributed match lowers the whole body even when another is conditioned only on frozen axes', () => {
        const findings = analyzePromptCacheStability({
          sections: TEMPLATE_THEN_SLOT,
          mergedBindings: new Map(),
          candidateMatches: [match(0), match(1)],
          resourceBindingResolutions: [],
          slots: [slot(SLOT_A, 'frozen')],
          candidates: [candidate({ lang: 'en' })],
          qualifiers
        });
        const refuted = refutations(findings);
        expect(refuted).toHaveLength(2);
        expect(refuted[1]).toMatchObject({ slot: SLOT_A, downgradedTo: 'per-request' });
        // The frozen axis does not refute the frozen claim, so only the unknown match is named.
        expect(refuted[1].detail).not.toMatch(/'lang'/);
        expect(refuted[1].detail).toMatch(/candidate\(s\) 1,/);
      });
    });
  });

  describe('preface stability (design.md §15, OQ-7)', () => {
    test("defaults an unannotated preface to frozen, matching C2's prior unconditional default", () => {
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 5, measured: 10 }),
        section({ kind: 'template', start: 5, chars: 5, measured: 10 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: 20 }
      });
      // Both sections frozen and well-ordered, at exactly the threshold — no findings.
      expect(findings).toEqual([]);
    });

    test('honors an explicit per-request declaration, treating the preface as volatile', () => {
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 5, measured: 10 }),
        section({ kind: 'template', start: 5, chars: 5, measured: 10 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        prefaceStability: 'per-request'
      });
      // The volatile preface precedes the frozen template — reported as both an ordering
      // hazard (D4) and a zero-length cacheable prefix (D5), exactly as an unclassified
      // per-request slot in the same position would be.
      expect(findingKinds(findings).sort()).toEqual(['cache-hostile-ordering', 'no-cacheable-prefix']);
    });

    test('honors an explicit per-conversation declaration', () => {
      const sections: IPromptSection[] = [section({ kind: 'preface', start: 0, chars: 5, measured: 10 })];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        prefaceStability: 'per-conversation',
        options: { minCacheablePrefixTokens: 20 }
      });
      expect(findingKinds(findings)).toEqual(['below-threshold']);
    });

    test('never refutes a preface claim, at any declared stability — there is no evidence to check it against', () => {
      const sections: IPromptSection[] = [section({ kind: 'preface', start: 0, chars: 5, measured: 10 })];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        prefaceStability: 'frozen',
        options: { minCacheablePrefixTokens: 20 }
      });
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
    });
  });

  describe('D4 — cache-hostile ordering', () => {
    test('fires when an unclassified (per-request-default) slot precedes a frozen template', () => {
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 3 }),
        section({ kind: 'template', start: 3, chars: 5 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)]
      });
      const ordering = findings.filter((f) => f.kind === 'cache-hostile-ordering');
      expect(ordering).toHaveLength(1);
      expect(ordering[0].detail).toMatch(/offset 0/);
      expect(ordering[0].detail).toMatch(/offset 3/);
      // The stranded per-request slot also yields no cacheable prefix (D5).
      expect(findingKinds(findings).sort()).toEqual(['cache-hostile-ordering', 'no-cacheable-prefix']);
    });

    test('a per-request slot that renders empty on this resolve still creates an ordering hazard', () => {
      // A slot's rendered length on THIS resolve says nothing about its length on another
      // resolve of the same prompt: an empty-here, per-request slot can render non-empty next
      // time, at the same position — exactly the byte-instability D4 exists to catch. Excluding
      // an empty section from the walk would suppress the warning for the case that matters most.
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 0, measured: 0 }),
        section({ kind: 'template', start: 0, chars: 5, measured: 5 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)],
        options: { minCacheablePrefixTokens: 1 }
      });
      expect(findingKinds(findings).sort()).toEqual(['cache-hostile-ordering', 'no-cacheable-prefix']);
    });

    test('does not fire when the more-stable run contributes no bytes', () => {
      // Unlike the per-request-side case above, an empty run on the
      // more-stable side is empty *because its (unrefuted) claim says it
      // can't change* — a trusted 'frozen' claim is invariant by definition,
      // so there is no later content on that side to strand or reorder.
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 3 }),
        section({ kind: 'slot', slot: SLOT_B, start: 3, chars: 0 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A), slot(SLOT_B, 'frozen')]
      });
      expect(findings.filter((f) => f.kind === 'cache-hostile-ordering')).toEqual([]);
    });

    test('sees past an empty stable run to a real hazard further out', () => {
      // per-request(non-empty) -> template/frozen(empty) -> per-conversation
      // (non-empty), three DISTINCT levels so foldRuns keeps them as three
      // separate runs. The empty frozen run must not "absorb" the check:
      // comparing only adjacent runs (per-request -> frozen, frozen ->
      // per-conversation) would miss that the per-conversation content is
      // genuinely stranded behind the leading per-request content, since
      // neither adjacent pair is an upward transition on its own once the
      // empty run sits between. The empty run is given kind 'template'
      // (distinct from the two 'slot' sections either side) precisely so the
      // assertion below can tell "correctly attributed to the real
      // per-conversation hazard" apart from "spuriously attributed to the
      // collapsed, contentless template run" — a regression to comparing
      // only immediate neighbors would report the latter and still produce
      // exactly one finding, so the count alone would not catch it.
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 3 }),
        section({ kind: 'template', start: 3, chars: 0 }),
        section({ kind: 'slot', slot: SLOT_C, start: 3, chars: 5 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A), slot(SLOT_C, 'per-conversation')]
      });
      const ordering = findings.filter((f) => f.kind === 'cache-hostile-ordering');
      expect(ordering).toHaveLength(1);
      expect(ordering[0].detail).toMatch(/one \(kind 'slot'/);
      expect(ordering[0].detail).not.toMatch(/one \(kind 'template'/);
    });

    test('does not collapse an empty per-conversation run — it can still fire an ordering hazard', () => {
      // frozen(non-empty) -> per-conversation(empty here) -> frozen(non-empty).
      // Unlike 'frozen', a 'per-conversation' claim is only stable WITHIN a
      // conversation — a different conversation resolving the same prompt
      // could render this slot non-empty, so an empty sample here is not
      // license to treat it as though it can never contribute bytes. The
      // second frozen run following it is still an upward transition.
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 5 }),
        section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 0 }),
        section({ kind: 'preface', start: 5, chars: 5 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation')]
      });
      expect(findings.filter((f) => f.kind === 'cache-hostile-ordering')).toHaveLength(1);
    });

    test('does not fire for a non-increasing (frozen, per-conversation, per-request) sequence', () => {
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 2 }),
        section({ kind: 'slot', slot: SLOT_A, start: 2, chars: 2 }),
        section({ kind: 'slot', slot: SLOT_B, start: 4, chars: 2 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation'), slot(SLOT_B, 'per-request')]
      });
      expect(findings.filter((f) => f.kind === 'cache-hostile-ordering')).toEqual([]);
    });

    test('fires once per upward transition across three runs', () => {
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 }), // per-request
        section({ kind: 'preface', start: 1, chars: 1 }), // frozen (up)
        section({ kind: 'slot', slot: SLOT_B, start: 2, chars: 1 }) // per-conversation, down from frozen — not up
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A), slot(SLOT_B, 'per-conversation')]
      });
      expect(findings.filter((f) => f.kind === 'cache-hostile-ordering')).toHaveLength(1);
    });
  });

  describe('D5 — threshold checks', () => {
    test('reports no-cacheable-prefix, naming volatile content, when the first section is already per-request', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)]
      });
      expect(findingKinds(findings)).toEqual(['no-cacheable-prefix']);
      expect(findings[0].detail).toMatch(/volatile content/);
    });

    test('reports no-cacheable-prefix, naming the absence of content, for an empty section list', () => {
      const findings = analyzePromptCacheStability({
        sections: [],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findingKinds(findings)).toEqual(['no-cacheable-prefix']);
      expect(findings[0].detail).toMatch(/no non-empty content/);
      expect(findings[0].detail).not.toMatch(/volatile content/);
    });

    test('reports no-cacheable-prefix, naming the absence of content, when every section collapses to empty', () => {
      // A single zero-byte 'frozen' preface: collapseEmptyStableRuns removes it entirely, so
      // there are no runs to walk even though `sections` itself is non-empty — this must not be
      // reported as "volatile content precedes nothing" (there is no volatile content here).
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 0, measured: 0 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findingKinds(findings)).toEqual(['no-cacheable-prefix']);
      expect(findings[0].detail).toMatch(/no non-empty content/);
      expect(findings[0].detail).not.toMatch(/volatile content/);
    });

    test('reports threshold-unknown when no measure was supplied', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findingKinds(findings)).toEqual(['threshold-unknown']);
      expect(findings[0].detail).toMatch(/no measure was supplied/);
    });

    test('reports threshold-unknown when measured but no minimum is configured', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5, measured: 42 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: []
      });
      expect(findingKinds(findings)).toEqual(['threshold-unknown']);
      expect(findings[0].detail).toMatch(/42 token/);
      expect(findings[0].detail).toMatch(/not known to this library/);
    });

    test('treats a NaN measure result as unknown rather than corrupting the total', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5, measured: Number.NaN })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: 1 }
      });
      expect(findingKinds(findings)).toEqual(['threshold-unknown']);
      expect(findings[0].detail).toMatch(/not a finite, non-negative number/);
    });

    test('treats a negative measure result as unknown rather than corrupting the total', () => {
      const findings = analyzePromptCacheStability({
        sections: [
          section({ kind: 'preface', start: 0, chars: 5, measured: 100 }),
          section({ kind: 'template', start: 5, chars: 5, measured: -1 })
        ],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: 1 }
      });
      expect(findingKinds(findings).filter((k) => k === 'threshold-unknown')).toHaveLength(1);
    });

    test('treats a NaN configured minimum as unknown rather than comparing against it', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5, measured: 10 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: Number.NaN }
      });
      expect(findingKinds(findings)).toEqual(['threshold-unknown']);
      expect(findings[0].detail).toMatch(/not a finite, non-negative token count/);
    });

    test('treats a negative configured minimum as unknown rather than comparing against it', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5, measured: 10 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: -1 }
      });
      expect(findingKinds(findings)).toEqual(['threshold-unknown']);
      expect(findings[0].detail).toMatch(/not a finite, non-negative token count/);
    });

    test('reports below-threshold when the measured prefix falls short of the configured minimum', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5, measured: 10 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: 50 }
      });
      expect(findingKinds(findings)).toEqual(['below-threshold']);
      expect(findings[0].detail).toMatch(/10 token/);
      expect(findings[0].detail).toMatch(/50 token/);
    });

    test('reports nothing when the measured prefix meets the configured minimum', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'preface', start: 0, chars: 5, measured: 50 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [],
        options: { minCacheablePrefixTokens: 50 }
      });
      expect(findings).toEqual([]);
    });

    test('counts genuinely cacheable bytes past a zero-byte stable run in the prefix', () => {
      // frozen(10) -> per-conversation(10) -> frozen(0) -> per-conversation(10):
      // 30 real cacheable tokens total. Without collapsing the empty frozen
      // run, the per-conversation -> frozen step reads as an upward
      // transition and stops the prefix walk at 20, wrongly reporting
      // below-threshold against a minimum only the full 30 would clear.
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 5, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 5, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_B, start: 10, chars: 0, measured: 0 }),
        section({ kind: 'slot', slot: SLOT_C, start: 10, chars: 5, measured: 10 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation'), slot(SLOT_B, 'frozen'), slot(SLOT_C, 'per-conversation')],
        options: { minCacheablePrefixTokens: 25 }
      });
      expect(findings).toEqual([]);
    });

    // design.md §5.1b / TECH_DEBT.md P2 — a `chars === 0` section must contribute `0` to the
    // measured total regardless of where the prefix boundary happens to fall. Every test above
    // this point uses `measured: 0` on its empty sections, under which inclusion and exclusion
    // of that section are indistinguishable in the reported total — which is exactly why the
    // shipped C2 bug survived 100% coverage. These three use a non-zero `measured` on the empty
    // section so a regression would show up as a wrong number, not just a wrong finding kind.
    test("excludes a zero-byte frozen run's measured value even when the walk continues past it", () => {
      // per-conversation(10) -> frozen, empty (measured 7) -> per-conversation(8): the walk
      // does not stop at the empty run (per-conversation -> per-conversation is neither upward
      // nor per-request), so it continues to the end and includes all three raw sections in the
      // slice. Before the fix this reported 25 (10+7+8) — the empty run's 7 counted because it
      // happened to sit interior to the walked region. TECH_DEBT.md's first table row.
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 5, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_B, start: 5, chars: 0, measured: 7 }),
        section({ kind: 'slot', slot: SLOT_C, start: 5, chars: 5, measured: 8 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation'), slot(SLOT_B, 'frozen'), slot(SLOT_C, 'per-conversation')]
      });
      const threshold = findings.filter((f) => f.kind === 'threshold-unknown');
      expect(threshold).toHaveLength(1);
      expect(threshold[0].detail).toMatch(/18 token/);
      expect(threshold[0].detail).not.toMatch(/25 token/);
    });

    test("excludes a zero-byte frozen run's measured value when it precedes the run that ends the walk", () => {
      // per-conversation(10) -> frozen, empty (measured 7) -> per-request(8, stranded): the walk
      // stops the instant it reaches the per-request run, so the prefix is just the first
      // section either way (10). TECH_DEBT.md's second table row — recorded here to show the
      // SAME empty-run measured value (7) is excluded from the total in both this layout and the
      // one above, where the pre-fix code disagreed with itself (25 vs. 10) depending on
      // position alone.
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 5, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_B, start: 5, chars: 0, measured: 7 }),
        section({ kind: 'slot', slot: SLOT_C, start: 5, chars: 5, measured: 8 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation'), slot(SLOT_B, 'frozen')]
        // SLOT_C carries no hint, so it defaults to 'per-request' (R-a) and ends the walk.
      });
      const threshold = findings.filter((f) => f.kind === 'threshold-unknown');
      expect(threshold).toHaveLength(1);
      expect(threshold[0].detail).toMatch(/10 token/);
    });

    test("excludes a zero-byte per-conversation section's measured value from the prefix total", () => {
      // Unlike a zero-byte frozen run, a zero-byte per-conversation run is never collapsed (it
      // isn't proven empty on every resolve) — so it stays in the run list and reaches the
      // summation step directly. Without the §5.1b filter this reports 17 (10+7); the section
      // contributes no text to what would actually be sent, so it must contribute 0.
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 5, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 0, measured: 7 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation')]
      });
      const threshold = findings.filter((f) => f.kind === 'threshold-unknown');
      expect(threshold).toHaveLength(1);
      expect(threshold[0].detail).toMatch(/10 token/);
      expect(threshold[0].detail).not.toMatch(/17 token/);
    });

    test('stops the cacheable prefix before frozen content following an empty per-conversation run', () => {
      // frozen(10) -> per-conversation(empty here, 0) -> frozen(10). Only the
      // first 10 tokens are safely cacheable: the empty per-conversation
      // slot is not proven to stay empty across every conversation, so the
      // second frozen run cannot be assumed reachable at a fixed offset.
      // Collapsing the per-conversation run here (as if it behaved like an
      // empty frozen run) would wrongly count all 20 tokens as cacheable.
      const sections: IPromptSection[] = [
        section({ kind: 'preface', start: 0, chars: 5, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 0, measured: 0 }),
        section({ kind: 'preface', start: 5, chars: 5, measured: 10 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation')],
        options: { minCacheablePrefixTokens: 15 }
      });
      expect(findingKinds(findings).filter((k) => k === 'below-threshold')).toHaveLength(1);
      const belowThreshold = findings.find((f) => f.kind === 'below-threshold');
      expect(belowThreshold?.detail).toMatch(/10 token/);
    });

    test('the cacheable prefix stops at the first upward transition, excluding stranded content', () => {
      const sections: IPromptSection[] = [
        section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1, measured: 5 }), // per-request
        section({ kind: 'preface', start: 1, chars: 1, measured: 5 }) // frozen (up) — stranded
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)]
      });
      // Zero-length prefix precedes the first (per-request) section, so D5
      // reports no-cacheable-prefix; D4 separately reports the ordering hazard.
      expect(findingKinds(findings).sort()).toEqual(['cache-hostile-ordering', 'no-cacheable-prefix']);
    });

    test('the cacheable prefix also stops at an upward transition that never reaches per-request', () => {
      // frozen -> per-conversation (downward, included) -> frozen (upward, excludes the rest).
      const sections: IPromptSection[] = [
        section({ kind: 'template', start: 0, chars: 1, measured: 10 }),
        section({ kind: 'slot', slot: SLOT_A, start: 1, chars: 1, measured: 10 }),
        section({ kind: 'template', start: 2, chars: 1, measured: 10 })
      ];
      const findings = analyzePromptCacheStability({
        sections,
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A, 'per-conversation')]
      });
      const threshold = findings.filter((f) => f.kind === 'threshold-unknown');
      expect(threshold).toHaveLength(1);
      // Only the first two sections (20 tokens) count — the third is stranded past the upward transition.
      expect(threshold[0].detail).toMatch(/20 token/);
    });
  });
});

describe('deriveCacheBreakpointOffsets (design.md §5.2, used by toCacheRequest)', () => {
  test('yields no breakpoints for a uniformly frozen composition — no downward transition exists', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 5 }),
      section({ kind: 'template', start: 5, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'frozen'])).toEqual([]);
  });

  test('yields no breakpoints for a uniform per-conversation composition — same reason', () => {
    const sections: IPromptSection[] = [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 10 })];
    expect(deriveCacheBreakpointOffsets(sections, ['per-conversation'])).toEqual([]);
  });

  test('yields one breakpoint at the frozen -> per-request transition', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 10 }),
      section({ kind: 'slot', slot: SLOT_A, start: 10, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-request'])).toEqual([10]);
  });

  test('yields one breakpoint at the frozen -> per-conversation transition, with nothing after it', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 10 }),
      section({ kind: 'slot', slot: SLOT_A, start: 10, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-conversation'])).toEqual([10]);
  });

  test('yields two breakpoints for frozen -> per-conversation -> per-request, in document order', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 10 }),
      section({ kind: 'slot', slot: SLOT_A, start: 10, chars: 8 }),
      section({ kind: 'slot', slot: SLOT_B, start: 18, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-conversation', 'per-request'])).toEqual([
      10, 18
    ]);
  });

  test('never emits more than two breakpoints — the three-level vocabulary admits at most two downward transitions', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 3 }),
      section({ kind: 'template', start: 3, chars: 3 }),
      section({ kind: 'slot', slot: SLOT_A, start: 6, chars: 3 }),
      section({ kind: 'slot', slot: SLOT_B, start: 9, chars: 3 })
    ];
    const offsets = deriveCacheBreakpointOffsets(sections, [
      'frozen',
      'frozen',
      'per-conversation',
      'per-request'
    ]);
    expect(offsets.length).toBeLessThanOrEqual(2);
    expect(offsets).toEqual([6, 9]);
  });

  test('yields no breakpoints when the first run is already per-request — no candidate prefix exists', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 5 }),
      section({ kind: 'preface', start: 5, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['per-request', 'frozen'])).toEqual([]);
  });

  test('stops at an upward transition and strands everything after it, per §5.1(ii)', () => {
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 5 }),
      section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 5 }),
      section({ kind: 'template', start: 10, chars: 5 })
    ];
    // frozen -> per-request (breakpoint) -> frozen (upward from per-request; per-request already
    // stopped the walk before this run is even considered).
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-request', 'frozen'])).toEqual([5]);
  });

  test('stops at an upward transition that never passes through per-request, with no breakpoint at that boundary', () => {
    // per-conversation -> frozen is upward (1 -> 2) without ever touching per-request — a
    // different code path than the per-request-triggered stop above, and one that must NOT emit a
    // breakpoint at the upward boundary itself (§5.1(i): only downward transitions are candidates).
    const sections: IPromptSection[] = [
      section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 5 }),
      section({ kind: 'preface', start: 5, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['per-conversation', 'frozen'])).toEqual([]);
  });

  test('does not emit a spurious breakpoint across a collapsed empty frozen run between two equal-level runs', () => {
    // per-conversation(10) -> frozen, empty (collapsed away) -> per-conversation(5): after the
    // empty frozen run is removed, the two per-conversation runs become adjacent in the run list
    // with EQUAL level — not a downward transition, so no breakpoint belongs between them. Without
    // the strict "<" check this would wrongly emit one at the second run's start offset.
    const sections: IPromptSection[] = [
      section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 10 }),
      section({ kind: 'slot', slot: SLOT_B, start: 10, chars: 0 }),
      section({ kind: 'slot', slot: 'slotC' as unknown as SlotName, start: 10, chars: 5 })
    ];
    expect(
      deriveCacheBreakpointOffsets(sections, ['per-conversation', 'frozen', 'per-conversation'])
    ).toEqual([]);
  });

  test('yields no breakpoints for an empty section list', () => {
    expect(deriveCacheBreakpointOffsets([], [])).toEqual([]);
  });

  test('never emits an offset at the end of the document — a trailing per-request slot rendering empty', () => {
    // Regression (found by code-reviewer, pre-merge): the transition-into offset is the start of
    // the run being entered. When that run is both the LAST content in the composition and renders
    // empty this resolve, its start coincides with the total document length — an offset
    // AiAssist.validateCacheBreakpoints rejects outright (must be < system.length), turning an
    // entirely ordinary "prompt ends with a dynamic slot that happens to be empty" resolve into a
    // hard failure. The genuine downward transition (frozen -> per-request) is real; only the
    // specific offset at the document's own length must be suppressed.
    const sections: IPromptSection[] = [
      section({ kind: 'template', start: 0, chars: 7 }),
      section({ kind: 'slot', slot: SLOT_A, start: 7, chars: 0 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-request'])).toEqual([]);
  });

  test('never emits an offset at the end of the document — a trailing per-conversation slot rendering empty', () => {
    // Same defect, different trailing stability level — not tied to 'per-request' specifically.
    const sections: IPromptSection[] = [
      section({ kind: 'template', start: 0, chars: 7 }),
      section({ kind: 'slot', slot: SLOT_A, start: 7, chars: 0 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-conversation'])).toEqual([]);
  });

  test('still emits the earlier breakpoint when a later, non-terminal transition is the one suppressed', () => {
    // frozen -> per-conversation (real breakpoint, not at the document end) -> per-request, empty,
    // terminal (its offset would equal the document length — suppressed). Confirms suppression is
    // scoped to the specific offending offset, not the whole derivation.
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 5 }),
      section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 5 }),
      section({ kind: 'slot', slot: SLOT_B, start: 10, chars: 0 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-conversation', 'per-request'])).toEqual([
      5
    ]);
  });

  test('does not emit a duplicate offset when two downward transitions land on the same empty run', () => {
    // Regression (Copilot review, post-push): frozen(5) -> empty per-conversation -> per-request.
    // The empty per-conversation run is NOT collapsed (collapseEmptyStableRuns only collapses
    // 'frozen' empty runs), so it survives as its own run and the per-request run after it starts
    // at the exact same offset (5) the per-conversation run started at. Both are genuine downward
    // transitions, so the pre-fix code pushed 5 twice — [5, 5], which
    // AiAssist.validateCacheBreakpoints rejects for being non-ascending. The boundary is real; it
    // is claimed once, by whichever transition reaches it first.
    const sections: IPromptSection[] = [
      section({ kind: 'preface', start: 0, chars: 5 }),
      section({ kind: 'slot', slot: SLOT_A, start: 5, chars: 0 }),
      section({ kind: 'slot', slot: SLOT_B, start: 5, chars: 5 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['frozen', 'per-conversation', 'per-request'])).toEqual([
      5
    ]);
  });

  test('does not emit an illegal offset 0 when the leading run is an empty non-frozen run', () => {
    // Regression (Copilot review, post-push): the leading run is 'per-conversation' with
    // chars === 0 (not collapsed, since collapsing is frozen-only), so the run after it starts at
    // offset 0. That transition is downward and, pre-fix, satisfied `offset < totalChars`, pushing
    // an illegal 0 — AiAssist.validateCacheBreakpoints requires every offset to be > 0.
    const sections: IPromptSection[] = [
      section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 0 }),
      section({ kind: 'slot', slot: SLOT_B, start: 0, chars: 8 })
    ];
    expect(deriveCacheBreakpointOffsets(sections, ['per-conversation', 'per-request'])).toEqual([]);
  });
});
