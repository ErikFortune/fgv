/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IBindingTraceEntry,
  ICandidateMatchTraceEntry,
  IPromptCacheDiagnosticOptions,
  IPromptCacheFinding,
  IPromptCacheStabilityHint,
  IPromptSection,
  IPromptSlot,
  IResourceBindingTraceEntry,
  PromptCacheStability,
  SlotName
} from '../types';

/**
 * Inputs to {@link analyzePromptCacheStability}, gathered from data a
 * `composition`-requesting resolve already holds.
 * @public
 */
export interface IPromptCacheStabilityAnalysisParams {
  /** Document-ordered, contiguous sections — {@link IPromptComposition.sections}. */
  readonly sections: ReadonlyArray<IPromptSection>;
  /** The resolve's merged bindings — {@link IPromptResolveTrace.mergedBindings}. */
  readonly mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>;
  /** The resolve's per-candidate match trace — {@link IPromptResolveTrace.candidateMatches}. */
  readonly candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>;
  /** The resolve's resource-binding entries — {@link IPromptResolveTrace.resourceBindingResolutions}. */
  readonly resourceBindingResolutions: ReadonlyArray<IResourceBindingTraceEntry>;
  /** The descriptor's slot declarations — {@link IPromptDescriptor.slots}. */
  readonly slots: ReadonlyArray<IPromptSlot>;
  /** Per-slot stability overrides from the resolve request. Wins over an authored claim. */
  readonly callSiteOverrides?: ReadonlyMap<SlotName, PromptCacheStability>;
  readonly options?: IPromptCacheDiagnosticOptions;
}

const STABILITY_LEVEL: Readonly<Record<PromptCacheStability, number>> = {
  frozen: 2,
  'per-conversation': 1,
  'per-request': 0
};

interface IStabilityRun {
  readonly level: number;
  readonly startIdx: number;
  readonly endIdx: number;
}

/**
 * Runs the prompt-cache stability diagnostics (design.md §9, checks D1–D5)
 * over a resolve's already-computed composition and trace.
 *
 * @remarks
 * Purely computational — no provider is consulted and nothing is emitted.
 * Findings report problems only; a wholly cacheable, well-ordered,
 * above-threshold prefix yields an empty array.
 * @public
 */
export function analyzePromptCacheStability(
  params: IPromptCacheStabilityAnalysisParams
): ReadonlyArray<IPromptCacheFinding> {
  const {
    sections,
    mergedBindings,
    candidateMatches,
    resourceBindingResolutions,
    slots,
    callSiteOverrides,
    options
  } = params;
  const findings: IPromptCacheFinding[] = [];

  const resourceBoundSlots = new Set(resourceBindingResolutions.map((entry) => entry.slot));
  const slotEffective = resolveSlotStability(
    slots,
    mergedBindings,
    resourceBoundSlots,
    callSiteOverrides,
    findings
  );
  const templateRefuted = checkConditionalTemplate(sections, candidateMatches, findings);

  // A section's `chars` on THIS resolve says nothing about its length on
  // another resolve of the same prompt — a 'per-request' slot rendering
  // empty here can render non-empty next time, at the same position. That
  // is exactly the byte-instability D4/D5 exist to catch, so a zero-length
  // section is not excluded from the walk: excluding it would suppress the
  // warning for the case where it matters most (an empty-this-time,
  // volatile-in-general slot ahead of stable content). D1/D2's refutation
  // findings are keyed on slots and candidates, not section length, and are
  // unaffected either way.
  const perSection = sections.map((section) =>
    effectiveSectionStability(section, slotEffective, templateRefuted)
  );

  const runs = foldRuns(perSection);
  checkHostileOrdering(sections, runs, findings);
  checkThreshold(sections, runs, options, findings);

  return findings;
}

/**
 * D1 — multi-scope binding, plus a resource-binding refutation the design's
 * D1 text doesn't name but the trace makes checkable. A slot claiming better
 * than `'per-request'` is downgraded when either:
 *
 * 1. Its winning binding is one of two-or-more scope-level bindings for that
 *    slot across the resolve's chain — the winning value depends on which
 *    scope wins in *this* chain, so a different chain could select a
 *    different value. Chain-relative evidence that the value *may* vary, not
 *    proof that it *does*.
 * 2. It is resource-bound — its value came from a full recursive
 *    {@link PromptLibrary.resolve} of an inner prompt with its own qualifier
 *    context. This function does not recurse into
 *    `resourceBindingResolutions[].innerTrace` to check whether that inner
 *    resolve is itself stable — doing so would need the same analysis run
 *    per level of nesting — so a resource-bound slot's claim is refuted
 *    unconditionally rather than risk trusting an inner resolve neither this
 *    check nor the caller has actually examined.
 *
 * Both are evidence the value *may* vary, not proof that it *does* — the
 * governing asymmetry (design.md §1) makes the downgrade correct anyway,
 * since a false `'frozen'` is the expensive mistake.
 */
function resolveSlotStability(
  slots: ReadonlyArray<IPromptSlot>,
  mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>,
  resourceBoundSlots: ReadonlySet<SlotName>,
  callSiteOverrides: ReadonlyMap<SlotName, PromptCacheStability> | undefined,
  findings: IPromptCacheFinding[]
): ReadonlyMap<SlotName, PromptCacheStability> {
  const effective = new Map<SlotName, PromptCacheStability>();

  for (const slot of slots) {
    const override = callSiteOverrides?.get(slot.name);
    const hint: IPromptCacheStabilityHint | undefined =
      override !== undefined
        ? { stability: override, origin: 'call-site' }
        : slot.cacheStability !== undefined
        ? { stability: slot.cacheStability, origin: 'authored' }
        : undefined;

    if (hint === undefined) {
      // No claim at all: the default is 'per-request' (R-a). Not recorded
      // as a hint because there is no origin to report — see D3.
      continue;
    }

    if (hint.stability !== 'per-request') {
      if (resourceBoundSlots.has(slot.name)) {
        findings.push({
          kind: 'stability-refuted',
          slot: slot.name,
          detail:
            `slot '${slot.name}': claimed '${hint.stability}' (${hint.origin}), but it is resource-bound — ` +
            `its value comes from a nested resolve this check does not inspect, so its stability is unverified`,
          claimed: hint,
          downgradedTo: 'per-request'
        });
        effective.set(slot.name, 'per-request');
        continue;
      }

      const entry = mergedBindings.get(slot.name);
      const chainBindingCount = entry?.source === 'binding' ? entry.chainBindingCount : undefined;
      if (chainBindingCount !== undefined && chainBindingCount >= 2) {
        findings.push({
          kind: 'stability-refuted',
          slot: slot.name,
          detail:
            `slot '${slot.name}': claimed '${hint.stability}' (${hint.origin}), but ${chainBindingCount} ` +
            `scopes in this chain declare a binding for it — the winning value may vary if the chain changes`,
          claimed: hint,
          downgradedTo: 'per-request'
        });
        effective.set(slot.name, 'per-request');
        continue;
      }
    }

    effective.set(slot.name, hint.stability);
  }

  return effective;
}

/**
 * D2 — conditional body. A `'template'` section's text comes from the
 * winning candidate(s)' joined body, which is rendered as a single Mustache
 * template — so a per-section attribution back to the contributing
 * candidate is not available from `IPromptComposition` (candidates are
 * already joined before segmentation runs). Applied at the coarser
 * granularity the data actually supports instead: if *any* candidate
 * matched with a non-empty, non-`matchAsDefault` condition set, the whole
 * joined body is qualifier-conditional, so every `'template'` section in
 * this resolve is downgraded together, uniformly.
 */
function checkConditionalTemplate(
  sections: ReadonlyArray<IPromptSection>,
  candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>,
  findings: IPromptCacheFinding[]
): boolean {
  if (!sections.some((section) => section.kind === 'template')) {
    return false;
  }

  const conditionalCandidates = candidateMatches.filter(
    (match) => match.matchType === 'match' && match.conditions.length > 0
  );
  if (conditionalCandidates.length === 0) {
    return false;
  }

  for (const match of conditionalCandidates) {
    findings.push({
      kind: 'stability-refuted',
      detail:
        `template candidate ${match.candidateIndex}: matched on ${match.conditions.length} condition(s) — ` +
        `the body is qualifier-conditional, not frozen`,
      claimed: { stability: 'frozen', origin: 'derived' },
      downgradedTo: 'per-request'
    });
  }
  return true;
}

/**
 * D3 — derived signals with no hints at all. A `'template'` section is
 * `'frozen'` unless D2 refuted it. A `'slot'` section uses its resolved
 * effective stability, defaulting to `'per-request'` (R-a) when neither an
 * authored nor a call-site claim exists — this default is exactly the
 * "unclassified" case design.md §9 describes: no hint was ever recorded for
 * it, but it still participates in ordering as the least-stable level, never
 * as `'frozen'` (R-b forbids the upgrade).
 *
 * A `'preface'` section is unconditionally `'frozen'`, on a narrower premise
 * than design.md §4's own wording ("preface... come[s] from checked-in
 * files") states: `IPromptSafetyPolicy.antiJailbreakPreface` is actually a
 * consumer-supplied `(descriptor: IPromptDescriptor) => Result<string>`
 * callback invoked on every resolve, not literally file content. The
 * assumption this makes explicit is that the callback is a **pure function
 * of `descriptor`** — deterministic, so byte-identical across every resolve
 * of *this prompt* (design.md §3's actual `'frozen'` contract: stable per
 * `(prompt, model)`, not stable globally). That mirrors the trust already
 * placed in Mustache template body content, which nothing here verifies
 * either. There is no trace data to check this assumption against — no
 * evidence a callback varied its output exists the way `candidateMatches`
 * evidences a conditional template — so unlike D1/D2 there is no refutation
 * path for a preface that breaks the assumption; it is a documented risk,
 * not a detected one.
 */
function effectiveSectionStability(
  section: IPromptSection,
  slotEffective: ReadonlyMap<SlotName, PromptCacheStability>,
  templateRefuted: boolean
): PromptCacheStability {
  if (section.kind === 'slot') {
    // `IPromptSection.slot` is always set when `kind === 'slot'` — every
    // producer of `IPromptSection` (`PromptLibrary._buildComposition`)
    // upholds that pairing, so trusting it here rather than adding an
    // unreachable defensive branch.
    return slotEffective.get(section.slot as SlotName) ?? 'per-request';
  }
  if (section.kind === 'template') {
    return templateRefuted ? 'per-request' : 'frozen';
  }
  return 'frozen';
}

function foldRuns(perSection: ReadonlyArray<PromptCacheStability>): ReadonlyArray<IStabilityRun> {
  const runs: { level: number; startIdx: number }[] = [];
  let previousLevel: number | undefined;
  perSection.forEach((stability, index) => {
    const level = STABILITY_LEVEL[stability];
    if (previousLevel === undefined || level !== previousLevel) {
      runs.push({ level, startIdx: index });
      previousLevel = level;
    }
  });
  return runs.map((run, index) => ({
    ...run,
    endIdx: index + 1 < runs.length ? runs[index + 1].startIdx : perSection.length
  }));
}

/**
 * D4 — cache-hostile ordering. Any upward transition between adjacent runs
 * (a less-stable run followed by a more-stable one) costs money today on
 * every provider whose caching is automatic (Gemini implicit, xAI, OpenAI's
 * default mode): none of them report a broken prefix, and byte order is the
 * only lever a caller has. Per design.md §5.2 step 3 this is also exactly
 * where a breakpoint plan would have to stop, so the ordering hazard and the
 * stranded-content hazard are the same finding.
 */
function checkHostileOrdering(
  sections: ReadonlyArray<IPromptSection>,
  runs: ReadonlyArray<IStabilityRun>,
  findings: IPromptCacheFinding[]
): void {
  for (let i = 1; i < runs.length; i++) {
    if (runs[i].level > runs[i - 1].level) {
      const before = sections[runs[i].startIdx - 1];
      const after = sections[runs[i].startIdx];
      findings.push({
        kind: 'cache-hostile-ordering',
        detail:
          `a less-stable section (kind '${before.kind}', offset ${before.start}) precedes a more-stable ` +
          `one (kind '${after.kind}', offset ${after.start}) — reordering so stability is non-increasing ` +
          `avoids paying for a broken cache prefix on every automatic-caching provider`
      });
    }
  }
}

/**
 * D5 / threshold checks (design.md §7 and §9). The cacheable prefix is the
 * leading run of sections whose stability stays non-increasing and above
 * `'per-request'` — the same "maximal monotone non-increasing prefix" §5.1
 * derives for breakpoint placement, stopping at whichever comes first: the
 * first `'per-request'` section, or the first upward transition (already
 * reported by D4). An empty prefix (the very first section is already
 * `'per-request'`) is `'no-cacheable-prefix'`. Otherwise the prefix's
 * measured size is judged against `options.minCacheablePrefixTokens`, with
 * `'threshold-unknown'` as the answer whenever the check cannot render a
 * verdict — no measure was supplied, or no minimum is known (R-c: unknown is
 * reported as unknown, never defaulted to a number).
 */
function checkThreshold(
  sections: ReadonlyArray<IPromptSection>,
  runs: ReadonlyArray<IStabilityRun>,
  options: IPromptCacheDiagnosticOptions | undefined,
  findings: IPromptCacheFinding[]
): void {
  let prefixEnd = 0;
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (run.level === STABILITY_LEVEL['per-request']) {
      break;
    }
    if (i > 0 && run.level > runs[i - 1].level) {
      break;
    }
    prefixEnd = run.endIdx;
  }

  if (prefixEnd === 0) {
    findings.push({
      kind: 'no-cacheable-prefix',
      detail: `no section precedes the resolve's volatile content — the declared/derived hints yield no cacheable prefix`
    });
    return;
  }

  const prefixSections = sections.slice(0, prefixEnd);
  const measureSupplied = prefixSections.every((section) => section.measured !== undefined);
  if (!measureSupplied) {
    findings.push({
      kind: 'threshold-unknown',
      detail: `no measure was supplied to the composition request — the cacheable prefix's token size cannot be evaluated`
    });
    return;
  }

  // `measureSupplied` above already guarantees every prefix section has
  // `measured` set, so trusting that rather than adding an unreachable `?? 0`
  // fallback branch. `measure` is a caller-supplied callback, though — it can
  // return NaN, Infinity, or a negative number for a given section, and
  // summing those would corrupt the total silently (NaN would make the
  // eventual threshold comparison always false; a negative section would
  // shrink the total below what was actually measured). Validated the same
  // way as the configured minimum below, per R-c.
  const measureInvalid = prefixSections.some(
    (section) => !Number.isFinite(section.measured as number) || (section.measured as number) < 0
  );
  if (measureInvalid) {
    findings.push({
      kind: 'threshold-unknown',
      detail: `the supplied measure returned a value that is not a finite, non-negative number for a section in the cacheable prefix — the prefix's token size cannot be evaluated`
    });
    return;
  }

  const measuredTotal = prefixSections.reduce((sum, section) => sum + (section.measured as number), 0);
  const minTokens = options?.minCacheablePrefixTokens;
  // A caller-supplied minimum that isn't a finite, non-negative number can't
  // render a verdict either way: NaN makes every comparison false (silently
  // no finding), and a negative value would always pass. Treat it the same
  // as "not supplied" rather than comparing against it — R-c: unknown is
  // reported as unknown, never used to fabricate a verdict.
  if (minTokens === undefined || !Number.isFinite(minTokens) || minTokens < 0) {
    findings.push({
      kind: 'threshold-unknown',
      detail:
        minTokens === undefined
          ? `stable prefix measures ${measuredTotal} token(s); this model's minimum cacheable prefix is not ` +
            `known to this library — supply one via IPromptCacheDiagnosticOptions.minCacheablePrefixTokens for a verdict`
          : `stable prefix measures ${measuredTotal} token(s); the configured minimum (${minTokens}) is not a ` +
            `finite, non-negative token count — supply a valid IPromptCacheDiagnosticOptions.minCacheablePrefixTokens for a verdict`
    });
    return;
  }

  if (measuredTotal < minTokens) {
    findings.push({
      kind: 'below-threshold',
      detail:
        `stable prefix measures ${measuredTotal} token(s), below the configured minimum of ` +
        `${minTokens} token(s)`
    });
  }
}
