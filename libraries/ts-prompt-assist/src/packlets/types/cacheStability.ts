/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { SlotName } from './ids';

/**
 * How often a section of a prompt changes between requests.
 *
 * @remarks
 * A closed, total-ordered set of exactly three levels —
 * `'frozen' > 'per-conversation' > 'per-request'` — because that is the full
 * set of distinctions any known prompt-cache mechanism can act on: a
 * breakpoint is placed *between* levels, and a cache is either shared or
 * conversation-scoped. See `design.md` §3 for why a fourth level would buy
 * nothing until a provider exposes a scoping axis that needs it.
 *
 * The governing asymmetry (`design.md` §1): a false `'per-request'` costs a
 * discount not taken; a false `'frozen'` costs the entire prefix, on every
 * request, silently. From it: **the default is `'per-request'`**, and a
 * stability claim may only ever be downgraded, never upgraded (R-b).
 * @public
 */
export type PromptCacheStability = 'frozen' | 'per-conversation' | 'per-request';

/**
 * Where a stability claim came from.
 *
 * @remarks
 * `'authored'` — declared on {@link IPromptSlot.cacheStability}.
 * `'call-site'` — declared on {@link IPromptResolveRequest.cacheStability},
 * which wins over an authored claim unconditionally.
 * `'derived'` — computed by the library itself from resolve-time evidence
 * (the template/preface default, and any downgrade a refutation check
 * applies), not declared by anyone. Refutation is an outcome, not an
 * origin — a refuted hint keeps its original origin and has its
 * `stability` lowered; only a claim that was never declared at all (the
 * template/preface default) carries `'derived'` as its origin. A finding
 * against the template default after an earlier refutation already lowered it
 * (the conditional-body check's competing-candidate finding) claims that
 * lowered level, still with origin `'derived'`.
 * @public
 */
export type PromptCacheStabilityOrigin = 'authored' | 'call-site' | 'derived';

/**
 * A stability claim, plus where it came from.
 * @public
 */
export interface IPromptCacheStabilityHint {
  readonly stability: PromptCacheStability;
  readonly origin: PromptCacheStabilityOrigin;
}

/**
 * Discriminator for a {@link IPromptCacheFinding}.
 *
 * @remarks
 * `'stability-refuted'` — a claim contradicted by resolve-time evidence;
 * the claim is downgraded, never upgraded. Fires for a declared slot claim
 * (multi-scope binding, a resource-bound slot, or a slot inside a
 * qualifier-conditional body) and for the derived `'template'` `'frozen'`
 * default (a qualifier-conditional body). A qualifier-conditional body refutes
 * a claim only when an axis conditioning it — a winning candidate's, or once
 * a winner is conditional, a competing candidate's — is declared (or defaults,
 * as `'per-request'`) less stable than the claim; see
 * {@link IExpectedQualifierAxis.stability}. A `'preface'` section's stability —
 * whether the `'frozen'` default or an explicit
 * {@link IPromptSafetyPolicy.antiJailbreakPrefaceStability} — is trusted, not
 * refuted: no resolve-time evidence can check it (see
 * `effectiveSectionStability`'s doc comment); this finding never fires for it.
 * `'cache-hostile-ordering'` — a stable section follows a less-stable one in
 * document order, which costs money today on every provider whose caching is
 * automatic, since byte order is the only lever those providers give a
 * caller.
 * `'no-cacheable-prefix'` — the resolve's stability hints yield no cacheable
 * prefix at all: the very first section is already `'per-request'`.
 * `'threshold-unknown'` — a cacheable prefix exists and (when a measure was
 * supplied) its size is known, but this library has no verified minimum to
 * judge it against.
 * `'below-threshold'` — a cacheable prefix exists, its size is known, a
 * minimum is known, and the prefix falls short of it.
 * @public
 */
export type PromptCacheFindingKind =
  | 'stability-refuted'
  | 'cache-hostile-ordering'
  | 'no-cacheable-prefix'
  | 'threshold-unknown'
  | 'below-threshold';

/**
 * One prompt-caching diagnostic finding.
 *
 * @remarks
 * Findings report problems, never successes — a resolve with a wholly
 * cacheable, well-ordered, above-threshold prefix produces no findings at
 * all. See `design.md` §9 for the checks (D1–D5) that produce these.
 * @public
 */
export interface IPromptCacheFinding {
  readonly kind: PromptCacheFindingKind;
  /** Slot this finding is about, when it is about one specific slot. */
  readonly slot?: SlotName;
  readonly detail: string;
  /** For a refutation: the claim as made. */
  readonly claimed?: IPromptCacheStabilityHint;
  /** For a refutation: the level the claim was lowered to. */
  readonly downgradedTo?: PromptCacheStability;
}

/**
 * Caller-supplied inputs to the prompt-cache threshold diagnostic.
 *
 * @remarks
 * There is deliberately no model-keyed registry lookup here — that home
 * (`design.md` §7) lives in `ts-extras/ai-assist` and serves the emit-path
 * breakpoint cap, which this package does not touch. This is the second of
 * the design's two homes for a caching minimum: a per-call override. When
 * neither home has an answer, the diagnostic reports the measured prefix
 * size and declines to judge it (R-c) — it never assumes the minimum is
 * zero.
 *
 * **The paired `measure` must be a tokenizer.** `IPromptCompositionOptions.measure` accepts any
 * `(text: string) => number` — a word count or character count is equally valid for other uses of
 * `IPromptComposition` — but this diagnostic reports its result in tokens and compares it against
 * `minCacheablePrefixTokens`, which is only meaningful when `measure` actually counts tokens. A
 * non-token measure produces a verdict labeled in the wrong unit, not a caught error: this
 * diagnostic has no way to tell what `measure` counts.
 * @public
 */
export interface IPromptCacheDiagnosticOptions {
  /** Minimum cacheable prefix, in tokens, to judge the diagnostic against. Omitted means unknown. */
  readonly minCacheablePrefixTokens?: number;
}
