/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { PromptId, ScopeKey, SlotName } from '../types';
import { IQualifierContext } from '../types';
import { PromptSubstitutions } from '../types';
import { IPromptResolveTrace, ISafeguardFinding, ISlotProvenanceEntry, SafeguardDisposition } from '../types';

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
 * LLM output round-trip, cross-linked to their resolve record. `'compose'`
 * records come from {@link HorizontalComposer.compose} (when the composer is
 * wired to a {@link IPromptObservationSeam}) and describe a multi-contributor
 * horizontal composition, nesting each contributor's resolve trace.
 *
 * @public
 */
export type PromptObservationPhase = 'resolve' | 'json-output' | 'free-text-output' | 'compose';

/**
 * Fields common to every {@link IPromptObservationRecord}, including the
 * `'compose'` record — which has no single resolve request and therefore
 * carries none of the request-shaped fields (`qualifierContext` /
 * `substitutions`) that {@link IPromptObservationBase} adds.
 *
 * @remarks
 * `seq` and `timestamp` are assigned by `PromptLibrary` (a single per-instance
 * authority) before the record is fanned out to observers, so the same record
 * carries the same `seq` across every store it lands in — which is what makes
 * {@link IPromptOutputObservation.linkedResolveSeq | linkedResolveSeq}
 * correlation work consistently across multiple observers. A `'compose'` record
 * shares this same `seq` space (it is minted through the same authority via the
 * {@link IPromptObservationSeam}), so a compose record and the contributor
 * `'resolve'` records it nests order consistently on `seq`.
 *
 * @public
 */
export interface IPromptObservationCommon {
  /**
   * Monotonic 1-based sequence number assigned by `PromptLibrary`, stable
   * across a store's ring eviction. The ordering / paging key.
   */
  readonly seq: number;
  /**
   * Dedupe key: CRC32 over RFC 8785 canonical JSON of the record's identity
   * tuple (via `Hash.Crc32Normalizer`). For request-shaped records the tuple is
   * `\{ promptId, chain, qualifierContext, substitutions \}`; for a `'compose'`
   * record it is `\{ composedPromptId, contributors \}` (each contributor's
   * `provenance` + `promptId`). Side-by-side with `seq` — a consumer picks which
   * to key a map / dedupe set on. Two identical operations share a `contentHash`
   * (by design — that is the dedupe signal).
   */
  readonly contentHash: string;
  /** Milliseconds since epoch when `PromptLibrary` produced the record. */
  readonly timestamp: number;
  /**
   * Wall-clock milliseconds from the start of the observed call until this
   * record was built — i.e. the resolve (or output round-trip, or compose merge)
   * computation itself. It does NOT include the time spent dispatching this
   * record to observers, so for awaited observers the end-to-end call latency is
   * slightly larger than `durationMs`.
   */
  readonly durationMs: number;
  /**
   * The prompt id. For request-shaped records this is the request's prompt id;
   * for a `'compose'` record it is the composed descriptor's id.
   */
  readonly promptId: PromptId;
  /**
   * The request's scope chain (most-specific → most-general), as supplied. A
   * `'compose'` record has no single resolve request and so carries an empty
   * chain — the contributor chains live on each nested contributor trace.
   */
  readonly chain: ReadonlyArray<ScopeKey>;
}

/**
 * Fields common to the request-shaped observation records
 * ({@link IPromptResolveObservation} and {@link IPromptOutputObservation}) —
 * i.e. every record produced by a call carrying a single resolve request.
 *
 * @public
 */
export interface IPromptObservationBase extends IPromptObservationCommon {
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
 * One nested contributor within an {@link IPromptComposeObservation}: the
 * composer-layer `provenance` a contributor was tagged with, plus the id and
 * full resolve `trace` of its independently-resolved prompt.
 *
 * @remarks
 * The `trace` is the direct analogue of
 * {@link IResourceBindingTraceEntry.innerTrace | resourceBindingResolutions[].innerTrace}
 * — nesting each contributor's full {@link IPromptResolveTrace} is what ties the
 * composed output back to the N independent contributor resolves an audit trail
 * would otherwise see disconnected from the composition.
 *
 * @public
 */
export interface IPromptComposeContributorObservation {
  /** Composer-layer provenance the contributor was tagged with. */
  readonly provenance: number;
  /** Id of the contributor's independently-resolved prompt. */
  readonly promptId: PromptId;
  /** The contributor's full resolve trace (the `innerTrace` analogue). */
  readonly trace: IPromptResolveTrace;
}

/**
 * One observation per {@link HorizontalComposer.compose} call, emitted only when
 * the composer is wired to a {@link IPromptObservationSeam}. Covers both success
 * and failure, mirroring {@link IPromptResolveObservation}.
 *
 * @remarks
 * A compose operation has no single resolve request, so it carries only the
 * {@link IPromptObservationCommon} fields — `promptId` is the composed
 * descriptor's id and `chain` is empty. The per-contributor resolve traces
 * (each contributor's own `chain` / `qualifierContext` / winning scope) live on
 * {@link IPromptComposeObservation.contributors | contributors}.
 *
 * The composed body is deliberately NOT duplicated here — it is derived from the
 * merged slot values and is reconstructable from the contributor traces +
 * `provenanceTrace`, mirroring how {@link IPromptOutputObservation} avoids
 * re-storing the resolved body.
 *
 * @public
 */
export interface IPromptComposeObservation extends IPromptObservationCommon {
  /** Discriminator. */
  readonly phase: 'compose';
  /** Whether the composition succeeded. */
  readonly outcome: 'success' | 'failure';
  /**
   * The contributors to this composition, in declared order, each nesting its
   * full resolve trace. Present on success and failure alike (contributors are
   * inputs to the compose, available regardless of outcome).
   */
  readonly contributors: ReadonlyArray<IPromptComposeContributorObservation>;
  /**
   * Present on success: per-composed-logical-slot contribution provenance,
   * keyed by logical slot name — the same
   * {@link IComposedPrompt.provenanceTrace} shape, reused rather than a parallel
   * summary, so "where did this composed slot come from" is answerable directly.
   */
  readonly provenanceTrace?: ReadonlyMap<SlotName, ReadonlyArray<ISlotProvenanceEntry>>;
  /** Present on success: the composed prompt's warn / info safeguard findings. */
  readonly safeguardFindings?: ReadonlyArray<ISafeguardFinding>;
  /** Present on failure: the compose failure `Result`'s message. */
  readonly error?: string;
}

/**
 * Discriminated union over observation record shapes.
 * @public
 */
export type IPromptObservationRecord =
  | IPromptResolveObservation
  | IPromptOutputObservation
  | IPromptComposeObservation;

/**
 * The narrow observation seam a {@link PromptLibrary} hands out (via
 * {@link PromptLibrary.observationSeam}) so a {@link HorizontalComposer} can emit
 * a `'compose'` observation that shares the library's `seq` authority, clock,
 * and observer fan-out — without the composer taking a dependency on the whole
 * library or minting its own sequence numbers (which would collide with the
 * store cursor's `lastSeq`).
 *
 * @remarks
 * The library owns all three because they must be shared: `seq` is a single
 * per-instance authority so a compose record orders consistently against the
 * contributor `'resolve'` records; `now` is the library's injected clock so
 * every record timestamps against the same source; `observe` is the library's
 * swallow-and-log fan-out so a composer-emitted record reaches every wired
 * observer under the same "observer errors never affect the caller" contract.
 *
 * @public
 */
export interface IPromptObservationSeam {
  /**
   * Mints the next monotonic 1-based `seq` from the library's single
   * per-instance authority.
   */
  nextSeq(): number;
  /** Reads the library's injected clock (milliseconds since epoch). */
  now(): number;
  /**
   * Fans a record out to every wired observer under the library's
   * swallow-and-log contract (observer errors never propagate). Resolves once
   * awaited observers have completed.
   * @param record - The observation record to dispatch.
   */
  observe(record: IPromptObservationRecord): Promise<void>;
}

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
   * Partial qualifier match: matched via the store's injected
   * {@link IQualifierResolver}. The default resolver does naive string
   * equality on the supplied (defined) axes — entries with `undefined` values
   * are skipped (no constraint on that axis). Production deployments needing
   * ts-res-equivalent similarity matching (e.g. BCP47 language-tag matches)
   * inject their own resolver at store creation time.
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

/**
 * Strategy for matching an {@link IPromptObservationQuery}'s `qualifiers`
 * criteria against an observation record's `qualifierContext`. Injected on
 * {@link PromptObservationStore.create} via
 * {@link IPromptObservationStoreCreateParams.qualifierResolver}.
 *
 * @remarks
 * The store ships with a default {@link defaultStringEqualityQualifierResolver}
 * that does naive string equality on the supplied (defined) axes. This is
 * intentionally a **narrower contract** than `PromptLibrary.resolve`'s
 * ts-res-driven candidate selection, which uses qualifier types (e.g. BCP47
 * language-tag similarity), priority ordering, and type-specific match
 * semantics: a record produced under `lang=fr-CA` will NOT be returned by a
 * `qualifiers: { lang: 'fr' }` query against the default resolver, even
 * though `PromptLibrary` would have considered them a match.
 *
 * Production deployments needing ts-res-equivalent semantics inject their own
 * `IQualifierResolver` implementation (e.g. one wrapping ts-res's
 * `ValidatingSimpleContextQualifierProvider` + `ResourceResolver` match path).
 * The injection point is locked here so the future swap is a pure
 * implementation-of-interface change rather than an API surface change.
 *
 * @public
 */
export interface IQualifierResolver {
  /**
   * Returns `true` iff the record's `qualifierContext` satisfies the query's
   * `qualifiers` criteria under this resolver's matching semantics.
   *
   * @param recordContext - The qualifier context the record was resolved under.
   * @param queryContext - The qualifier criteria from the consumer's query.
   */
  matches(recordContext: IQualifierContext, queryContext: IQualifierContext): boolean;
}
