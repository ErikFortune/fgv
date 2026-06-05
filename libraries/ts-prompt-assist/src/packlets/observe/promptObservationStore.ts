/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Collections, Result, fail, succeed } from '@fgv/ts-utils';
import { IQualifierContext, ISafeguardFinding, SafeguardDisposition, ScopeKey } from '../types';
import {
  IPromptObservationQuery,
  IPromptObservationRecord,
  IPromptObserver,
  IQualifierResolver
} from './types';

/**
 * Default {@link IQualifierResolver} — naive string equality on the supplied
 * (defined) axes. Records resolved under a richer ts-res match (e.g. BCP47
 * `lang=fr-CA` matching a candidate gated on `lang=fr`) will NOT be returned
 * by a query asking for the broader axis value under this resolver. See
 * {@link IQualifierResolver} for the broader contract and the rationale for
 * the divergence.
 *
 * @public
 */
export const defaultStringEqualityQualifierResolver: IQualifierResolver = {
  matches(recordContext: IQualifierContext, queryContext: IQualifierContext): boolean {
    for (const key of Object.keys(queryContext)) {
      const value: string | undefined = queryContext[key];
      if (value === undefined) {
        continue;
      }
      if (recordContext[key] !== value) {
        return false;
      }
    }
    return true;
  }
};

/**
 * Construction options for {@link PromptObservationStore.create}.
 * @public
 */
export interface IPromptObservationStoreCreateParams {
  /**
   * Maximum number of observation records retained before the oldest is
   * overwritten. Defaults to `1000`. Must be a positive integer if supplied.
   */
  readonly maxRecords?: number;
  /**
   * Optional {@link IQualifierResolver} that decides whether a record's
   * `qualifierContext` matches a query's `qualifiers` criteria. Defaults to
   * {@link defaultStringEqualityQualifierResolver} (naive string equality on
   * supplied axes). Injected here so deployments needing ts-res-equivalent
   * similarity matching can swap the implementation without an API change on
   * the store.
   */
  readonly qualifierResolver?: IQualifierResolver;
}

/**
 * The default in-memory observation store: an {@link IPromptObserver} that
 * retains the records it observes in a bounded ring and answers schema-aware
 * {@link PromptObservationStore.query | queries} over them.
 *
 * @remarks
 * **Privacy posture — this store is most-permissive by design.** It retains
 * every field of every record verbatim, including the rendered `body`, the raw
 * LLM `rawOutput`, the `qualifierContext`, and the caller `substitutions`
 * (which may carry PII). The library bakes in **no** redaction, retention, or
 * field-stripping policy — that is deployment policy, not library policy. A
 * deployment that must redact either wraps this store with its own
 * {@link IPromptObserver} that transforms records before forwarding, or
 * substitutes a different observer entirely (write-to-SIEM, hashing store,
 * etc.). Size is the only bounded dimension, via `maxRecords`.
 *
 * The store implements {@link IPromptObserver} directly — `observe` (the hook)
 * and `query` (the read surface) live on the same class. Wire it via
 * `IPromptLibraryCreateParams.observers`. `seq` and `timestamp` are assigned by
 * `PromptLibrary` before `observe`, so this store never mints them.
 *
 * @public
 */
export class PromptObservationStore implements IPromptObserver {
  /**
   * The bounded ring of observed records. `PromptLibrary` assigns each record's
   * `seq`, so the ring's monotonic-`seq` cursor contract is satisfied by the
   * library's per-instance counter.
   * @internal
   */
  private readonly _buffer: Collections.RetainingRingBuffer<IPromptObservationRecord>;

  /**
   * Strategy for matching query `qualifiers` against record `qualifierContext`.
   * Injected at construction; defaults to
   * {@link defaultStringEqualityQualifierResolver}.
   * @internal
   */
  private readonly _qualifierResolver: IQualifierResolver;

  /**
   * @param buffer - The pre-constructed backing ring buffer.
   * @param qualifierResolver - The qualifier-match strategy for `query`.
   * @internal
   */
  private constructor(
    buffer: Collections.RetainingRingBuffer<IPromptObservationRecord>,
    qualifierResolver: IQualifierResolver
  ) {
    this._buffer = buffer;
    this._qualifierResolver = qualifierResolver;
  }

  /**
   * The highest `seq` observed so far. Hold this value and pass it as
   * `sinceSeq` to {@link PromptObservationStore.query | query} to page only
   * records observed afterward. Stable across ring eviction and
   * {@link PromptObservationStore.clear | clear}.
   */
  public get lastSeq(): number {
    return this._buffer.lastSeq;
  }

  /**
   * The number of records currently retained.
   */
  public get size(): number {
    return this._buffer.size;
  }

  /**
   * Family-convention factory.
   * @param params - {@link IPromptObservationStoreCreateParams | Construction options}.
   * @returns On success, a new store. Fails if `maxRecords` is supplied and is
   * not a positive integer.
   */
  public static create(params?: IPromptObservationStoreCreateParams): Result<PromptObservationStore> {
    const maxRecords = params?.maxRecords;
    if (maxRecords !== undefined && (!Number.isInteger(maxRecords) || maxRecords < 1)) {
      return fail(`PromptObservationStore: maxRecords must be a positive integer (got ${maxRecords})`);
    }
    const qualifierResolver = params?.qualifierResolver ?? defaultStringEqualityQualifierResolver;
    return succeed(
      new PromptObservationStore(
        new Collections.RetainingRingBuffer<IPromptObservationRecord>({ maxRecords }),
        qualifierResolver
      )
    );
  }

  /**
   * {@inheritDoc IPromptObserver.observe}
   */
  public observe(record: IPromptObservationRecord): Promise<Result<unknown>> {
    this._buffer.push(record);
    return Promise.resolve(succeed(record));
  }

  /**
   * Returns retained records, oldest-first, narrowed by the supplied criteria.
   * @param criteria - {@link IPromptObservationQuery | AND-combined filter criteria}.
   * @returns The matching records, oldest-first.
   */
  public query(criteria?: IPromptObservationQuery): ReadonlyArray<IPromptObservationRecord> {
    return this._buffer.query({
      sinceSeq: criteria?.sinceSeq,
      limit: criteria?.limit,
      filter: criteria === undefined ? undefined : (record) => this._matches(record, criteria)
    });
  }

  /**
   * Clears all retained records. Does NOT reset {@link PromptObservationStore.lastSeq | lastSeq},
   * so a held `sinceSeq` cursor never re-sees a sequence number.
   */
  public clear(): void {
    this._buffer.clear();
  }

  /**
   * Tests a record against the non-`seq`/`limit` criteria (those are applied by
   * the ring buffer itself).
   * @internal
   */
  private _matches(record: IPromptObservationRecord, criteria: IPromptObservationQuery): boolean {
    if (criteria.since !== undefined && record.timestamp < criteria.since) {
      return false;
    }
    if (criteria.until !== undefined && record.timestamp > criteria.until) {
      return false;
    }
    if (criteria.promptId !== undefined && record.promptId !== criteria.promptId) {
      return false;
    }
    if (criteria.phase !== undefined && record.phase !== criteria.phase) {
      return false;
    }
    if (criteria.outcome !== undefined && record.outcome !== criteria.outcome) {
      return false;
    }
    if (criteria.scope !== undefined && !this._matchesScope(record, criteria.scope)) {
      return false;
    }
    if (criteria.qualifiers !== undefined && !this._matchesQualifiers(record, criteria.qualifiers)) {
      return false;
    }
    if (criteria.outputKind !== undefined) {
      if (record.phase !== 'resolve' || record.outputKind !== criteria.outputKind) {
        return false;
      }
    }
    if (criteria.hasSafeguardFindings !== undefined) {
      if (this._hasSafeguardFindings(record) !== criteria.hasSafeguardFindings) {
        return false;
      }
    }
    if (
      criteria.safeguardDisposition !== undefined &&
      !this._hasDisposition(record, criteria.safeguardDisposition)
    ) {
      return false;
    }
    if (criteria.filter !== undefined && !criteria.filter(record)) {
      return false;
    }
    return true;
  }

  /**
   * A scope matches if the record's request chain includes it, or (for a
   * resolve record) it is the winning scope.
   * @internal
   */
  private _matchesScope(record: IPromptObservationRecord, scope: ScopeKey): boolean {
    if (record.chain.includes(scope)) {
      return true;
    }
    return record.phase === 'resolve' && record.winningScope === scope;
  }

  /**
   * Delegates to the injected {@link IQualifierResolver}. The default
   * ({@link defaultStringEqualityQualifierResolver}) does naive string
   * equality on supplied (defined) axes; a consumer-supplied resolver may
   * implement different semantics (e.g. ts-res-style similarity matching).
   * @internal
   */
  private _matchesQualifiers(
    record: IPromptObservationRecord,
    qualifiers: IPromptObservationQuery['qualifiers'] & object
  ): boolean {
    return this._qualifierResolver.matches(record.qualifierContext, qualifiers);
  }

  /**
   * @internal
   */
  private _hasSafeguardFindings(record: IPromptObservationRecord): boolean {
    return this._safeguardFindings(record).length > 0;
  }

  /**
   * @internal
   */
  private _hasDisposition(record: IPromptObservationRecord, disposition: SafeguardDisposition): boolean {
    return this._safeguardFindings(record).some((f) => f.disposition === disposition);
  }

  /**
   * Safeguard findings live on success resolve records only.
   * @internal
   */
  private _safeguardFindings(record: IPromptObservationRecord): ReadonlyArray<ISafeguardFinding> {
    if (record.phase === 'resolve' && record.safeguardFindings !== undefined) {
      return record.safeguardFindings;
    }
    return [];
  }
}
