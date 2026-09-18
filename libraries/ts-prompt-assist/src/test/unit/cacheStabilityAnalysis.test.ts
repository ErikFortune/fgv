/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Runtime as TsResRuntime } from '@fgv/ts-res';
import { analyzePromptCacheStability } from '../../packlets/resolve';
import {
  IBindingTraceEntry,
  ICandidateMatchTraceEntry,
  IPromptCacheFinding,
  IPromptSection,
  IPromptSlot,
  IResourceBindingTraceEntry,
  PromptCacheStability,
  SlotName
} from '../../packlets/types';

const SLOT_A = 'slotA' as unknown as SlotName;
const SLOT_B = 'slotB' as unknown as SlotName;

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

    test('does not fire when there are no template sections at all', () => {
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
      expect(findings.filter((f) => f.kind === 'stability-refuted')).toEqual([]);
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
    test('reports no-cacheable-prefix when the first section is already per-request', () => {
      const findings = analyzePromptCacheStability({
        sections: [section({ kind: 'slot', slot: SLOT_A, start: 0, chars: 1 })],
        mergedBindings: new Map(),
        candidateMatches: [],
        resourceBindingResolutions: [],
        slots: [slot(SLOT_A)]
      });
      expect(findingKinds(findings)).toEqual(['no-cacheable-prefix']);
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
