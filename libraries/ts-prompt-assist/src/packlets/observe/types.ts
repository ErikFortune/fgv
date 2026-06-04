/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { PromptId, ScopeKey } from '../types';
import { IQualifierContext } from '../types';
import { PromptSubstitutions } from '../types';
import { IPromptResolveTrace, ISafeguardFinding, SafeguardDisposition } from '../types';

/**
 * The output-contract kind surfaced on a successful resolve observation — a
 * top-level mirror of the resolved descriptor's `output.kind`, surfaced so a
 * store can filter on it without walking into the descriptor.
 * @public
 */
export type PromptObservationOutputKind = 'free-text' | 'json';

/**
 * The phase of the `PromptLibrary` call that produced an observation record.
 *
 * @remarks
 * `'resolve'` records come from {@link PromptLibrary.resolve} (and the inner
 * resolve of an output call). `'json-output'` / `'free-text-output'` records
 * come from {@link PromptLibrary.resolveJsonOutput} /
 * {@link PromptLibrary.resolveFreeTextOutput} respectively and describe the
 * LLM output round-trip, cross-linked to their resolve record.
 *
 * @public
 */
export type PromptObservationPhase = 'resolve' | 'json-output' | 'free-text-output';

/**
 * Fields common to every {@link IPromptObservationRecord}.
 *
 * @remarks
 * `seq` and `timestamp` are assigned by `PromptLibrary` (a single per-instance
 * authority) before the record is fanned out to observers, so the same record
 * carries the same `seq` across every store it lands in — which is what makes
 * {@link IPromptOutputObservation.linkedResolveSeq | linkedResolveSeq}
 * correlation work consistently across multiple observers.
 *
 * @public
 */
export interface IPromptObservationBase {
  /**
   * Monotonic 1-based sequence number assigned by `PromptLibrary`, stable
   * across a store's ring eviction. The ordering / paging key.
   */
  readonly seq: number;
  /**
   * Dedupe key: CRC32 over RFC 8785 canonical JSON of
   * `\{ promptId, chain, qualifierContext, substitutions \}` (via
   * `Hash.Crc32Normalizer`). Side-by-side with `seq` — a consumer picks which
   * to key a map / dedupe set on. Two resolves of the same request share a
   * `contentHash` (by design — that is the dedupe signal).
   */
  readonly contentHash: string;
  /** Milliseconds since epoch when `PromptLibrary` produced the record. */
  readonly timestamp: number;
  /** Wall-clock duration of the observed call, in milliseconds. */
  readonly durationMs: number;
  /** The prompt id from the request. */
  readonly promptId: PromptId;
  /** The request's scope chain (most-specific → most-general), as supplied. */
  readonly chain: ReadonlyArray<ScopeKey>;
  /**
   * The caller's qualifier context, verbatim. Privacy / redaction is a
   * storage-layer concern — see {@link PromptObservationStore}.
   */
  readonly qualifierContext: IQualifierContext;
  /**
   * The caller's substitutions, if any, verbatim. May carry PII — redaction is
   * a storage-layer concern, not a library concern.
   */
  readonly substitutions?: PromptSubstitutions;
}

/**
 * One observation per public {@link PromptLibrary.resolve} call (and per inner
 * resolve of an output call). Covers both success and failure.
 *
 * @remarks
 * On failure, only `error` is populated alongside the base fields — the resolve
 * trace is constructed only on the success path inside `PromptLibrary`, so a
 * failed resolve carries no `trace` (v0.1; see the stream's OQ-4 lock).
 *
 * @public
 */
export interface IPromptResolveObservation extends IPromptObservationBase {
  /** Discriminator. */
  readonly phase: 'resolve';
  /** Whether the resolve succeeded. */
  readonly outcome: 'success' | 'failure';
  /** Present on success: scope whose record won (`trace.winningScope`). */
  readonly winningScope?: ScopeKey;
  /** Present on success: the final rendered body (post-Mustache, post-preface). */
  readonly body?: string;
  /** Present on success: the resolved descriptor's `output.kind`. */
  readonly outputKind?: PromptObservationOutputKind;
  /** Present on success: the full existing resolve trace. */
  readonly trace?: IPromptResolveTrace;
  /**
   * Present on success: a top-level mirror of `trace.safeguardFindings`,
   * surfaced so a store can filter on disposition without walking the trace.
   */
  readonly safeguardFindings?: ReadonlyArray<ISafeguardFinding>;
  /** Present on failure: the failure `Result`'s message. */
  readonly error?: string;
}

/**
 * One observation per {@link PromptLibrary.resolveJsonOutput} /
 * {@link PromptLibrary.resolveFreeTextOutput} call, describing the LLM output
 * round-trip and cross-linked to its resolve record via `linkedResolveSeq`.
 *
 * @remarks
 * Does not duplicate the rendered body — that lives on the linked resolve
 * record (the stream's OQ-8 lock). Correlate via
 * {@link IPromptOutputObservation.linkedResolveSeq | linkedResolveSeq}.
 *
 * @public
 */
export interface IPromptOutputObservation extends IPromptObservationBase {
  /** Discriminator. */
  readonly phase: 'json-output' | 'free-text-output';
  /** `seq` of the `'resolve'` record produced by this call's inner resolve. */
  readonly linkedResolveSeq: number;
  /** Whether the output round-trip (resolve + validation) succeeded. */
  readonly outcome: 'success' | 'failure';
  /** The LLM's raw response string, verbatim. Redaction is a storage-layer concern. */
  readonly rawOutput: string;
  /** Present on failure: the parse / validation / resolve failure message. */
  readonly error?: string;
}

/**
 * Discriminated union over observation record shapes.
 * @public
 */
export type IPromptObservationRecord = IPromptResolveObservation | IPromptOutputObservation;

/**
 * Single-method async observer hook. `PromptLibrary` fires `observe` once per
 * public resolve / output call (never for nested resource-binding resolves).
 *
 * @remarks
 * Observer errors never affect the `resolve()` return — the library swallows a
 * failed `Result` or a thrown/rejected `observe`, logging it to the injected
 * diagnostic logger at `warn`.
 *
 * @public
 */
export interface IPromptObserver {
  /**
   * When `true`, `PromptLibrary` dispatches `observe` without awaiting it, so a
   * slow remote observer (SIEM, network sink) does not extend `resolve()`
   * latency. Defaults to `false` (awaited), which is correct for the cheap
   * in-memory default {@link PromptObservationStore}. Errors are swallowed
   * either way.
   */
  readonly fireAndForget?: boolean;
  /**
   * Receives a fully-formed observation record.
   * @param record - The observation record.
   * @returns A `Result` whose failure is swallowed (logged to the library's
   * diagnostic logger). A rejected promise is likewise swallowed.
   */
  observe(record: IPromptObservationRecord): Promise<Result<unknown>>;
}

/**
 * Query criteria for {@link PromptObservationStore.query}. All supplied
 * criteria are AND-combined.
 * @public
 */
export interface IPromptObservationQuery {
  /** Only records with `seq > sinceSeq` (incremental paging cursor). */
  readonly sinceSeq?: number;
  /** Return at most this many records — the most-recent N, still oldest-first. */
  readonly limit?: number;
  /** Only records with `timestamp >= since`. */
  readonly since?: number;
  /** Only records with `timestamp <= until`. */
  readonly until?: number;
  /** Only records for this prompt id. */
  readonly promptId?: PromptId;
  /**
   * Only records whose resolve won at this scope OR whose request chain
   * includes it.
   */
  readonly scope?: ScopeKey;
  /**
   * Partial qualifier match: every supplied key must equal the record's
   * qualifier-context value for that key.
   */
  readonly qualifiers?: IQualifierContext;
  /** Only success resolve records with this `output.kind`. */
  readonly outputKind?: PromptObservationOutputKind;
  /** Only records with this outcome. */
  readonly outcome?: 'success' | 'failure';
  /** Only records of this phase. */
  readonly phase?: PromptObservationPhase;
  /** Only records that carry (or do not carry) any safeguard findings. */
  readonly hasSafeguardFindings?: boolean;
  /** Only records carrying at least one safeguard finding with this disposition. */
  readonly safeguardDisposition?: SafeguardDisposition;
  /** Arbitrary escape-hatch predicate, applied after all other criteria. */
  readonly filter?: (record: IPromptObservationRecord) => boolean;
}
