/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { PromptCacheStability } from './cacheStability';
import { IPromptDescriptor } from './descriptor';
import { PromptId } from './ids';
import { IPromptSlot } from './slot';
import { ISafeguardFinding } from './trace';

/**
 * Context passed to an {@link IScreener} for a single slot value.
 *
 * @remarks
 * The `value` is **post-binding, pre-render** — the substituted slot content
 * before Mustache templating, which is the correct screening point. The full
 * {@link IPromptSlot} and the owning `promptId` are supplied for richer
 * attribution; `source` is the slot's declared source label (when any), so a
 * screener can implement its own source-aware skipping.
 *
 * @public
 */
export interface IScreenerContext {
  /** The slot whose merged value is being screened. */
  readonly slot: IPromptSlot;
  /** The slot's declared source label, when set. */
  readonly source?: string;
  /** The prompt whose resolve triggered the screen. */
  readonly promptId: PromptId;
  /** Post-binding, pre-render slot value. */
  readonly value: string;
}

/**
 * A pluggable, per-slot-value, pre-render safety screener.
 *
 * @remarks
 * `screen` is invoked once per merged slot value — one that resolved to a
 * binding, default, or caller substitution (the empty fallback is skipped) —
 * during a resolve, before the Mustache render. The value may itself be an
 * empty string. It returns zero, one, or many {@link ISafeguardFinding}s
 * (an empty array signals no concerns). The signature is always async so ML
 * classifiers and remote-call screeners compose uniformly; a synchronous
 * screener simply returns a resolved promise. A returned `Result.fail`
 * signals an *operational* failure (not a finding) and propagates as a resolve
 * failure. Screeners run sequentially in policy declaration order, and a
 * finding with `disposition: 'reject'` short-circuits the remaining screeners.
 *
 * @public
 */
export interface IScreener {
  /** Name used for traceability and finding attribution. */
  readonly name: string;
  /** Screens a single slot value; see {@link IScreenerContext}. */
  readonly screen: (ctx: IScreenerContext) => Promise<Result<ReadonlyArray<ISafeguardFinding>>>;
}

/**
 * Safety policy supplied to {@link PromptLibrary.create}.
 *
 * @remarks
 * All fields are optional. When omitted, the library applies no global length
 * cap (per-slot / per-descriptor caps still apply), runs no screeners, and adds
 * no anti-jailbreak preface. The length cap and the anti-jailbreak preface stay
 * policy-level primitives — they are structurally distinct from per-slot-value
 * screening (pre-screen and post-render respectively) and are not expressed as
 * {@link IScreener}s.
 *
 * @public
 */
export interface IPromptSafetyPolicy {
  /**
   * Fallback maximum length applied when neither the slot's `maxLength` nor
   * the descriptor's `safeguards.defaultMaxLength` is set. When omitted, no
   * global cap applies.
   */
  readonly defaultMaxLength?: number;
  /**
   * Screeners run against each merged slot value (post-binding, pre-render),
   * sequentially in declaration order. See {@link IScreener}. Use
   * {@link createPatternScreener} for regex-based injection screening.
   */
  readonly screeners?: ReadonlyArray<IScreener>;
  /**
   * Optional post-render seam: consumer-supplied text prepended (with a
   * newline separator) to the body AFTER Mustache substitution completes.
   * The library ships no default content. Invoked with the descriptor; the
   * returned text is NOT subject to template substitution — it frames the
   * rendered prompt.
   */
  readonly antiJailbreakPreface?: (descriptor: IPromptDescriptor) => Result<string>;
  /**
   * Declared cache stability for the `antiJailbreakPreface` text. Default `'frozen'`, matching
   * `analyzePromptCacheStability`'s prior unconditional default for a `'preface'` section.
   *
   * @remarks
   * `antiJailbreakPreface` is a consumer-supplied callback invoked fresh on every resolve, not
   * checked-in file content — unlike a `'template'` section, whose D2 refutation (design.md §9)
   * gives the library resolve-time evidence to downgrade a wrong `'frozen'` claim. A callback can
   * vary its output (per-descriptor policy text, a rotated warning, anything short of a pure
   * function of `descriptor`) with no trace data recording that it did, so there is no refutation
   * path for a preface that breaks the assumption (design.md §15, OQ-7). Neither blanket default
   * is safe: `'frozen'` risks a silent, permanent cache miss on a genuinely dynamic preface (the
   * design's worst case, §1); `'per-request'` would report `'cache-hostile-ordering'` on every
   * resolve with a preface followed by any more-stable content, which is the common, correct
   * shape (fixed framing text, then stable instructions). Declaring it here — the same
   * call-site-style override the annotation vocabulary already gives every other stability claim
   * (design.md §4) — lets the policy author who actually knows whether their callback is
   * deterministic say so, rather than the library guessing on their behalf. Defaulting to
   * `'frozen'` preserves C2's shipped behavior for every existing caller.
   */
  readonly antiJailbreakPrefaceStability?: PromptCacheStability;
}
